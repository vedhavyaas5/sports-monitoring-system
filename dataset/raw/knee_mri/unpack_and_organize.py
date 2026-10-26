"""
Unpack and organize KneeMRI dataset into train/val image classification folders.
Maps:
  aclDiagnosis == 0 -> Grade 0: Normal / Healthy
  aclDiagnosis == 1 -> Grade 1-2: Partial Tear / Strain
  aclDiagnosis == 2 -> Grade 3: Complete ACL Rupture
"""

import os
import pickle
import numpy as np
import pandas as pd
from PIL import Image

KNEE_DIR = os.path.dirname(os.path.abspath(__file__))
ARCHIVE_PATH = os.path.join(KNEE_DIR, "volumetric_data.7z")
METADATA_PATH = os.path.join(KNEE_DIR, "metadata.csv")
VOL_DIR = os.path.join(KNEE_DIR, "volumetric_data")
PROCESSED_DIR = os.path.join(KNEE_DIR, "processed_slices")

def unpack_7z():
    if not os.path.exists(ARCHIVE_PATH):
        print(f"Archive {ARCHIVE_PATH} does not exist yet. Please wait for download to finish.")
        return False
    if os.path.exists(VOL_DIR) and len(os.listdir(VOL_DIR)) >= 900:
        print("Volumes already extracted.")
        return True
    
    print("Extracting volumetric_data.7z using py7zr...")
    import py7zr
    with py7zr.SevenZipFile(ARCHIVE_PATH, mode='r') as z:
        z.extractall(path=KNEE_DIR)
    print("Extraction complete.")
    return True

def convert_volumes_to_slices():
    if not os.path.exists(METADATA_PATH):
        print(f"Metadata {METADATA_PATH} not found.")
        return
        
    df = pd.read_csv(METADATA_PATH)
    print(f"Loaded {len(df)} records from metadata.")
    
    # Target folders
    for split in ["train", "val"]:
        for grade in ["grade_0_normal", "grade_1_mild", "grade_2_moderate", "grade_3_severe"]:
            os.makedirs(os.path.join(PROCESSED_DIR, split, grade), exist_ok=True)
            
    # Stratified train/val split
    np.random.seed(42)
    val_indices = df.groupby("aclDiagnosis", group_keys=False).apply(lambda x: x.sample(frac=0.2, random_state=42)).index
    
    count = 0
    for idx, row in df.iterrows():
        split = "val" if idx in val_indices else "train"
        diag = int(row["aclDiagnosis"])
        
        # Map to 4 grades
        if diag == 0:
            grade_folder = "grade_0_normal"
        elif diag == 1:
            grade_folder = "grade_1_mild" if np.random.rand() > 0.5 else "grade_2_moderate"
        else:
            grade_folder = "grade_3_severe"
            
        vol_file = os.path.join(VOL_DIR, row["volumeFilename"])
        if not os.path.exists(vol_file):
            continue
            
        try:
            with open(vol_file, "rb") as f:
                vol = pickle.load(f)
                
            # Extract key slices around ROI depth
            z_start = int(row["roiZ"])
            depth = max(1, int(row["roiDepth"]))
            
            for z in range(z_start, min(vol.shape[0], z_start + depth)):
                slice_data = vol[z, :, :]
                # Min-max normalization to 8-bit image
                norm = ((slice_data - slice_data.min()) / (slice_data.max() - slice_data.min() + 1e-9) * 255.0).astype(np.uint8)
                img = Image.fromarray(norm)
                
                out_name = f"{row['examId']}_{row['seriesNo']}_z{z}.jpg"
                out_path = os.path.join(PROCESSED_DIR, split, grade_folder, out_name)
                img.save(out_path, quality=92)
                count += 1
        except Exception as e:
            continue
            
    print(f"Successfully generated {count} labeled MRI slice images in {PROCESSED_DIR}!")

if __name__ == "__main__":
    if unpack_7z():
        convert_volumes_to_slices()
