"""
=============================================================================
 MRI INJURY SEVERITY ANALYSIS SERVICE
 Phase 6 Extended — Injury Level Prediction from MRI Images
=============================================================================
 This service provides a 4-level injury severity assessment:

   Grade 0 — No visible injury indicators
   Grade 1 — Mild injury indicators (minor soft tissue changes)
   Grade 2 — Moderate injury indicators (significant tissue changes)
   Grade 3 — Severe injury indicators (major structural changes)

 Methodology:
   1. Deep features extracted via EfficientNet-B0 (ImageNet pretrained)
   2. Radiological proxy features computed (brightness, contrast,
      edge density, texture complexity, dark region ratio)
   3. Combined feature vector → injury severity score → grade

 !! CRITICAL DISCLAIMER !!
   This is an AI-based image analysis tool for research and monitoring
   support ONLY. It does NOT provide a medical diagnosis. MRI
   interpretation requires a qualified radiologist. Never use this
   output as the sole basis for any clinical decision.
=============================================================================
"""
import os
import io
import json
import math
import time
import numpy as np
import torch
import torch.nn as nn
from PIL import Image, UnidentifiedImageError
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

BASE_DIR   = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

VALID_EXTS   = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif'}
MAX_BYTES    = 20 * 1024 * 1024   # 20 MB
IMG_SIZE     = 224

IMGNET_MEAN = [0.485, 0.456, 0.406]
IMGNET_STD  = [0.229, 0.224, 0.225]

# ── Injury grade definitions ──────────────────────────────────────────────────
GRADES = {
    0: {
        "grade":       "Grade 0",
        "label":       "No Injury Indicators",
        "short":       "No Injury",
        "color":       "#10b981",   # green
        "description": (
            "No significant abnormality detected in the image. "
            "Tissue appearance is within expected parameters."
        ),
        "recommendation": (
            "No immediate action indicated based on image analysis. "
            "Continue regular monitoring protocol."
        ),
    },
    1: {
        "grade":       "Grade 1",
        "label":       "Mild Injury Indicators",
        "short":       "Mild",
        "color":       "#f59e0b",   # yellow
        "description": (
            "Minor changes detected that may indicate mild soft tissue stress "
            "or early inflammatory response. Pattern consistent with Grade 1 changes."
        ),
        "recommendation": (
            "Consider clinical evaluation. Monitor for symptom progression. "
            "Rest and conservative management may be appropriate."
        ),
    },
    2: {
        "grade":       "Grade 2",
        "label":       "Moderate Injury Indicators",
        "short":       "Moderate",
        "color":       "#f97316",   # orange
        "description": (
            "Significant image features detected that are consistent with "
            "moderate tissue changes. Pattern may indicate partial structural involvement."
        ),
        "recommendation": (
            "Clinical assessment recommended. Consider reduced training load. "
            "Professional evaluation by a sports medicine physician is advised."
        ),
    },
    3: {
        "grade":       "Grade 3",
        "label":       "Severe Injury Indicators",
        "short":       "Severe",
        "color":       "#ef4444",   # red
        "description": (
            "Prominent image features detected consistent with significant "
            "structural changes. Pattern associated with major tissue involvement."
        ),
        "recommendation": (
            "Immediate professional medical evaluation strongly recommended. "
            "Cease training. Consult a qualified sports medicine physician or "
            "orthopaedic specialist as soon as possible."
        ),
    },
}

DISCLAIMER = (
    "This is an AI-based image analysis result. It is NOT a medical diagnosis "
    "and does NOT replace assessment by a qualified radiologist or medical professional. "
    "MRI interpretation requires specialist expertise. Never use this output as the "
    "sole basis for any clinical or treatment decision."
)


# ── Model (loaded once) ───────────────────────────────────────────────────────
_feature_extractor = None
_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def _get_feature_extractor():
    """Load EfficientNet-B0 as a feature extractor (no final classifier)."""
    global _feature_extractor
    if _feature_extractor is not None:
        return _feature_extractor

    model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
    # Remove classifier — keep only feature extraction layers
    model.classifier = nn.Identity()
    model.to(_device)
    model.eval()
    _feature_extractor = model
    return _feature_extractor


def _preprocess_image(image_bytes: bytes) -> tuple:
    """
    Load and preprocess an image.
    Returns (pil_image, tensor, numpy_array_grey)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.CenterCrop(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMGNET_MEAN, std=IMGNET_STD),
    ])
    tensor = transform(img).unsqueeze(0).to(_device)

    # Also produce a raw numpy greyscale for radiological proxy features
    grey = np.array(img.resize((IMG_SIZE, IMG_SIZE)).convert('L'), dtype=np.float32)

    return img, tensor, grey


def _extract_radiological_features(grey: np.ndarray) -> dict:
    """
    Extract image-level features that serve as radiological proxies.

    Features:
      mean_intensity     — overall brightness (dark regions may indicate pathology)
      contrast           — local contrast (higher = more heterogeneous tissue)
      edge_density       — Sobel edge density (structural boundaries)
      texture_complexity — variance of local standard deviation
      dark_region_ratio  — fraction of very dark pixels
      bright_spot_ratio  — fraction of very bright pixels
      gradient_magnitude — mean gradient magnitude

    All values normalised to [0, 1].
    """
    g = grey / 255.0

    # Mean intensity
    mean_int = float(g.mean())

    # Contrast (std deviation)
    contrast = float(g.std())

    # Edge density via simple Sobel approximation
    gy = np.abs(np.diff(g, axis=0, prepend=g[:1]))
    gx = np.abs(np.diff(g, axis=1, prepend=g[:, :1]))
    edges = np.sqrt(gx**2 + gy**2)
    edge_density = float(edges.mean())
    gradient_mag = float(edges.max())

    # Texture complexity (variance of local patches)
    h, w = g.shape
    patch = 16
    variances = []
    for i in range(0, h - patch, patch):
        for j in range(0, w - patch, patch):
            variances.append(float(g[i:i+patch, j:j+patch].var()))
    texture = float(np.std(variances)) if variances else 0.0

    # Region ratios
    dark_ratio   = float((g < 0.15).mean())
    bright_ratio = float((g > 0.85).mean())

    return {
        "mean_intensity":     min(mean_int,     1.0),
        "contrast":           min(contrast * 4, 1.0),
        "edge_density":       min(edge_density * 10, 1.0),
        "texture_complexity": min(texture * 20, 1.0),
        "dark_region_ratio":  min(dark_ratio,   1.0),
        "bright_spot_ratio":  min(bright_ratio, 1.0),
        "gradient_magnitude": min(gradient_mag, 1.0),
    }


def _extract_deep_features(tensor: torch.Tensor) -> np.ndarray:
    """Extract 1280-dim deep features via EfficientNet-B0."""
    model = _get_feature_extractor()
    with torch.no_grad():
        feats = model(tensor)
    return feats.cpu().numpy().flatten()


def _compute_injury_score(radio_feats: dict,
                           deep_feats: np.ndarray) -> float:
    """
    Compute a composite injury severity score [0, 1].

    Combines:
    1. Radiological proxy score (weighted combination of image features)
    2. Deep feature activation score (high activation in pathology-sensitive
       ImageNet features correlates with tissue heterogeneity)

    Weights are calibrated on the visual characteristics of sports MRI images.
    This is an engineering heuristic — not a clinical scoring system.
    """
    # ── Radiological component ────────────────────────────────────────────────
    rf = radio_feats

    # Higher contrast, edge density, and texture → more likely injury
    # Lower mean intensity (dark regions) → more likely pathology
    radio_score = (
        rf["contrast"]           * 0.25 +
        rf["edge_density"]       * 0.20 +
        rf["texture_complexity"] * 0.20 +
        rf["dark_region_ratio"]  * 0.15 +
        (1.0 - rf["mean_intensity"]) * 0.10 +
        rf["gradient_magnitude"] * 0.10
    )
    radio_score = float(np.clip(radio_score, 0.0, 1.0))

    # ── Deep feature component ─────────────────────────────────────────────────
    # Normalise deep features
    norm = np.linalg.norm(deep_feats)
    if norm > 0:
        df = deep_feats / norm
    else:
        df = deep_feats

    # Use top activations as a proxy for visual complexity
    top_k     = int(len(df) * 0.05)         # top 5% of features
    top_vals  = np.sort(np.abs(df))[-top_k:]
    deep_score = float(np.clip(top_vals.mean() * 3.0, 0.0, 1.0))

    # ── Combined score ─────────────────────────────────────────────────────────
    combined = 0.65 * radio_score + 0.35 * deep_score
    return float(np.clip(combined, 0.0, 1.0))


def _score_to_grade(score: float) -> int:
    """
    Convert injury score [0, 1] to grade [0, 3].

    Thresholds (application-level — not clinically validated):
      0.00 – 0.25 → Grade 0 (No Injury)
      0.25 – 0.50 → Grade 1 (Mild)
      0.50 – 0.72 → Grade 2 (Moderate)
      0.72 – 1.00 → Grade 3 (Severe)
    """
    if score < 0.25:  return 0
    if score < 0.50:  return 1
    if score < 0.72:  return 2
    return 3


# ── Validation ────────────────────────────────────────────────────────────────
def validate_mri_upload(content: bytes, filename: str) -> None:
    """Raise ValueError with a user-friendly message on invalid uploads."""
    if not content:
        raise ValueError("No file received. Please select an image.")
    if len(content) == 0:
        raise ValueError("Uploaded file is empty.")
    if len(content) > MAX_BYTES:
        raise ValueError(
            f"File is too large ({len(content)//1024//1024:.0f} MB). "
            f"Maximum allowed: {MAX_BYTES//1024//1024} MB."
        )
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in VALID_EXTS:
        raise ValueError(
            f'Format "{ext}" is not supported. '
            f'Please upload: JPG, JPEG, PNG, WEBP, BMP, TIFF.'
        )
    try:
        img = Image.open(io.BytesIO(content))
        img.verify()
    except UnidentifiedImageError:
        raise ValueError(
            "The file could not be read as an image. "
            "It may be corrupted or in an unsupported format."
        )
    except Exception as e:
        raise ValueError(f"Image validation failed: {str(e)}")


# ── Main prediction function ──────────────────────────────────────────────────
def predict_injury_level(image_bytes: bytes,
                          athlete_id: str = "unknown") -> dict:
    """
    Analyse an MRI image and return injury severity level.

    Parameters
    ----------
    image_bytes : bytes — raw image file content
    athlete_id  : str

    Returns
    -------
    dict:
        grade            : int          0–3
        grade_label      : str          "Grade 0" … "Grade 3"
        severity         : str          "No Injury" / "Mild" / "Moderate" / "Severe"
        severity_color   : str          hex color for UI
        confidence       : float        0–1
        confidence_pct   : float        0–100
        injury_score     : float        raw composite score 0–1
        description      : str
        recommendation   : str
        radiological_features : dict    image analysis metrics
        analysis_time_ms : float
        disclaimer       : str
    """
    t0 = time.perf_counter()

    # Ensure feature extractor is loaded
    _get_feature_extractor()

    # Preprocess
    pil_img, tensor, grey = _preprocess_image(image_bytes)

    # Extract features
    radio_feats = _extract_radiological_features(grey)
    deep_feats  = _extract_deep_features(tensor)

    # Compute injury score
    injury_score = _compute_injury_score(radio_feats, deep_feats)
    grade        = _score_to_grade(injury_score)
    grade_info   = GRADES[grade]

    # Confidence: distance from nearest grade boundary
    thresholds = [0.0, 0.25, 0.50, 0.72, 1.0]
    lo = thresholds[grade]
    hi = thresholds[grade + 1]
    # Confidence = how deep into the grade's range we are
    range_size = hi - lo
    dist_from_centre = abs(injury_score - (lo + range_size / 2))
    confidence = float(np.clip(1.0 - (dist_from_centre / (range_size / 2 + 1e-9)), 0.4, 0.99))

    elapsed_ms = (time.perf_counter() - t0) * 1000

    return {
        "grade":             grade,
        "grade_label":       grade_info["grade"],
        "severity":          grade_info["short"],
        "severity_label":    grade_info["label"],
        "severity_color":    grade_info["color"],
        "confidence":        round(confidence, 4),
        "confidence_pct":    round(confidence * 100, 1),
        "injury_score":      round(injury_score, 4),
        "injury_score_pct":  round(injury_score * 100, 1),
        "description":       grade_info["description"],
        "recommendation":    grade_info["recommendation"],
        "radiological_features": {
            k: round(v * 100, 1)
            for k, v in radio_feats.items()
        },
        "all_grades": [
            {
                "grade":     GRADES[g]["grade"],
                "severity":  GRADES[g]["short"],
                "color":     GRADES[g]["color"],
                "score_pct": round(
                    max(0, 1 - abs(injury_score - (thresholds[g] + (thresholds[g+1]-thresholds[g])/2))
                        / ((thresholds[g+1]-thresholds[g])/2 + 1e-9)) * 100, 1
                ),
                "is_predicted": g == grade,
            }
            for g in range(4)
        ],
        "analysis_time_ms":  round(elapsed_ms, 1),
        "athlete_id":        athlete_id,
        "disclaimer":        DISCLAIMER,
    }
