"""
Construct a balanced, high-fidelity multi-joint sports MRI & MSK dataset:
- Knee Meniscus (Normal & Tear)
- Lumbar Spine MRI (Normal & Mild Stenosis)
- Shoulder & Extremity (Severe Fractures/Tears)
- Mild Sports Ligament & Patellar Strain

Produces balanced class representations across all 4 severity grades.
"""
import os
import io
import shutil
import glob
import pyarrow.parquet as pq
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(BASE_DIR, 'dataset', 'raw')
OUT_DIR = os.path.join(BASE_DIR, 'dataset', 'processed', 'mri_training')

GRADES = ['grade_0_normal', 'grade_1_mild', 'grade_2_moderate', 'grade_3_severe']

def build_balanced_dataset():
    if os.path.exists(OUT_DIR):
        shutil.rmtree(OUT_DIR)
        
    for split in ['train', 'val']:
        for g in GRADES:
            os.makedirs(os.path.join(OUT_DIR, split, g), exist_ok=True)
            
    print(f"Target directory ready: {OUT_DIR}")
    
    # --- GRADE 0: Normal / Intact ---
    # 1. Knee Meniscus Healthy (100 train, 52 val)
    km_train_h = glob.glob(os.path.join(RAW_DIR, 'knee_meniscus', 'train', 'healthy', '*.jpg'))
    for i, fp in enumerate(km_train_h):
        shutil.copy(fp, os.path.join(OUT_DIR, 'train', 'grade_0_normal', f'knee_norm_{i:03d}.jpg'))
    km_val_h = glob.glob(os.path.join(RAW_DIR, 'knee_meniscus', 'valid', 'healthy', '*.jpg'))
    for i, fp in enumerate(km_val_h):
        shutil.copy(fp, os.path.join(OUT_DIR, 'val', 'grade_0_normal', f'knee_val_norm_{i:03d}.jpg'))

    # 2. Add 80 Lumbar Spine Normal (label == 0)
    spine_path = os.path.join(RAW_DIR, 'spine_mri', 'rsna_lumbar_spine.parquet')
    if os.path.exists(spine_path):
        table = pq.read_table(spine_path)
        df_spine = table.slice(0, 800).to_pandas()
        spine_norm = df_spine[df_spine['label'] == 0]
        for i, (_, row) in enumerate(spine_norm.iloc[:100].iterrows()):
            im = Image.open(io.BytesIO(row['image']['bytes'])).convert('RGB')
            split = 'train' if i < 80 else 'val'
            im.save(os.path.join(OUT_DIR, split, 'grade_0_normal', f'spine_norm_{i:03d}.jpg'), 'JPEG')

    # --- GRADE 1: Mild Signal Alteration / Strain ---
    # 1. Mild sports reference slices
    ref_slices = glob.glob(os.path.join(RAW_DIR, 'knee_mri', 'extracted_sample', '*.jpg'))
    sports_images = glob.glob(os.path.join(BASE_DIR, 'dataset', 'medical imaging sports data', 'medical imaging sports data', '*.webp'))
    g1_list = []
    for i, fp in enumerate(ref_slices + sports_images[:30]):
        try:
            im = Image.open(fp).convert('RGB')
            g1_list.append(im)
        except Exception:
            pass
    for i, im in enumerate(g1_list):
        split = 'train' if i < int(len(g1_list)*0.75) else 'val'
        im.save(os.path.join(OUT_DIR, split, 'grade_1_mild', f'mild_ref_{i:03d}.jpg'), 'JPEG')

    # 2. Spine Mild Narrowing (label == 1)
    if os.path.exists(spine_path):
        spine_mild = df_spine[df_spine['label'] == 1]
        for i, (_, row) in enumerate(spine_mild.iloc[:120].iterrows()):
            im = Image.open(io.BytesIO(row['image']['bytes'])).convert('RGB')
            split = 'train' if i < 95 else 'val'
            im.save(os.path.join(OUT_DIR, split, 'grade_1_mild', f'spine_mild_{i:03d}.jpg'), 'JPEG')

    # --- GRADE 2: Moderate Injury (Knee Meniscus Tears) ---
    km_train_m = glob.glob(os.path.join(RAW_DIR, 'knee_meniscus', 'train', 'meniscus', '*.jpg'))
    for i, fp in enumerate(km_train_m):
        shutil.copy(fp, os.path.join(OUT_DIR, 'train', 'grade_2_moderate', f'knee_tear_{i:03d}.jpg'))
    km_val_m = glob.glob(os.path.join(RAW_DIR, 'knee_meniscus', 'valid', 'meniscus', '*.jpg'))
    for i, fp in enumerate(km_val_m):
        shutil.copy(fp, os.path.join(OUT_DIR, 'val', 'grade_2_moderate', f'knee_val_tear_{i:03d}.jpg'))

    # Add 40 Spine moderate cases (label == 2)
    if os.path.exists(spine_path):
        spine_mod = df_spine[df_spine['label'] == 2]
        for i, (_, row) in enumerate(spine_mod.iloc[:40].iterrows()):
            im = Image.open(io.BytesIO(row['image']['bytes'])).convert('RGB')
            split = 'train' if i < 30 else 'val'
            im.save(os.path.join(OUT_DIR, split, 'grade_2_moderate', f'spine_mod_{i:03d}.jpg'), 'JPEG')

    # --- GRADE 3: Severe Injury (Extremity Fractures & Structural Ruptures) ---
    sh_train = glob.glob(os.path.join(RAW_DIR, 'shoulder_extremity', 'train', '*.jpg'))
    for i, fp in enumerate(sh_train[:180]):  # Balanced at 180 to avoid overwhelming
        shutil.copy(fp, os.path.join(OUT_DIR, 'train', 'grade_3_severe', f'shoulder_sev_{i:03d}.jpg'))
    sh_val = glob.glob(os.path.join(RAW_DIR, 'shoulder_extremity', 'valid', '*.jpg'))
    for i, fp in enumerate(sh_val[:60]):
        shutil.copy(fp, os.path.join(OUT_DIR, 'val', 'grade_3_severe', f'shoulder_val_sev_{i:03d}.jpg'))

    print("\nBalanced Multi-Joint Training Set Summary:")
    for split in ['train', 'val']:
        total = 0
        details = []
        for g in GRADES:
            c = len(os.listdir(os.path.join(OUT_DIR, split, g)))
            details.append(f"{g}: {c}")
            total += c
        print(f"  {split.upper()}: {total} images -> {', '.join(details)}")

if __name__ == '__main__':
    build_balanced_dataset()
