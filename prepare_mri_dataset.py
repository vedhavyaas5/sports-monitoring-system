"""
Prepare and organize downloaded multi-joint sports MRI & musculoskeletal imaging datasets
into standard PyTorch ImageFolder splits for training and validation.
"""
import os
import shutil
import glob
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(BASE_DIR, 'dataset', 'raw')
OUT_DIR = os.path.join(BASE_DIR, 'dataset', 'processed', 'mri_training')

GRADES = ['grade_0_normal', 'grade_1_mild', 'grade_2_moderate', 'grade_3_severe']

def prepare():
    # Clean previous output
    if os.path.exists(OUT_DIR):
        shutil.rmtree(OUT_DIR)
        
    for split in ['train', 'val']:
        for g in GRADES:
            os.makedirs(os.path.join(OUT_DIR, split, g), exist_ok=True)
            
    print("Created target directories in:", OUT_DIR)
    
    # 1. Grade 0: Normal / Healthy Knee Meniscus
    km_train_h = glob.glob(os.path.join(RAW_DIR, 'knee_meniscus', 'train', 'healthy', '*.jpg'))
    for i, fp in enumerate(km_train_h):
        shutil.copy(fp, os.path.join(OUT_DIR, 'train', 'grade_0_normal', f'knee_h_{i:03d}.jpg'))
        
    km_val_h = glob.glob(os.path.join(RAW_DIR, 'knee_meniscus', 'valid', 'healthy', '*.jpg'))
    for i, fp in enumerate(km_val_h):
        shutil.copy(fp, os.path.join(OUT_DIR, 'val', 'grade_0_normal', f'knee_val_h_{i:03d}.jpg'))
        
    print(f"Grade 0: {len(km_train_h)} train, {len(km_val_h)} val copied.")
    
    # 2. Grade 1: Mild joint signal deviations
    ref_slices = glob.glob(os.path.join(RAW_DIR, 'knee_mri', 'extracted_sample', '*.jpg'))
    sports_images = glob.glob(os.path.join(BASE_DIR, 'dataset', 'medical imaging sports data', 'medical imaging sports data', '*.webp'))
    
    g1_all = []
    # Convert webp/jpg to standard RGB JPEG
    for i, fp in enumerate(ref_slices + sports_images[:30]):
        try:
            im = Image.open(fp).convert('RGB')
            dest_name = f'mild_{i:03d}.jpg'
            g1_all.append((im, dest_name))
        except Exception:
            pass
            
    n_train_g1 = int(len(g1_all) * 0.75)
    for idx, (im, name) in enumerate(g1_all):
        split = 'train' if idx < n_train_g1 else 'val'
        im.save(os.path.join(OUT_DIR, split, 'grade_1_mild', name), 'JPEG')
    print(f"Grade 1: {n_train_g1} train, {len(g1_all) - n_train_g1} val saved.")
    
    # 3. Grade 2: Moderate Injury (Knee Meniscus Tears)
    km_train_m = glob.glob(os.path.join(RAW_DIR, 'knee_meniscus', 'train', 'meniscus', '*.jpg'))
    for i, fp in enumerate(km_train_m):
        shutil.copy(fp, os.path.join(OUT_DIR, 'train', 'grade_2_moderate', f'knee_m_{i:03d}.jpg'))
        
    km_val_m = glob.glob(os.path.join(RAW_DIR, 'knee_meniscus', 'valid', 'meniscus', '*.jpg'))
    for i, fp in enumerate(km_val_m):
        shutil.copy(fp, os.path.join(OUT_DIR, 'val', 'grade_2_moderate', f'knee_val_m_{i:03d}.jpg'))
    print(f"Grade 2: {len(km_train_m)} train, {len(km_val_m)} val copied.")
    
    # 4. Grade 3: Severe Injury (Shoulder / Extremity Bone Fractures & Ruptures)
    sh_train = glob.glob(os.path.join(RAW_DIR, 'shoulder_extremity', 'train', '*.jpg'))
    for i, fp in enumerate(sh_train):
        shutil.copy(fp, os.path.join(OUT_DIR, 'train', 'grade_3_severe', f'shoulder_t_{i:03d}.jpg'))
        
    sh_val = glob.glob(os.path.join(RAW_DIR, 'shoulder_extremity', 'valid', '*.jpg'))
    for i, fp in enumerate(sh_val):
        shutil.copy(fp, os.path.join(OUT_DIR, 'val', 'grade_3_severe', f'shoulder_v_{i:03d}.jpg'))
    print(f"Grade 3: {len(sh_train)} train, {len(sh_val)} val copied.")
    
    print("\nSummary of Prepared Image Cohort:")
    for split in ['train', 'val']:
        total = 0
        counts = []
        for g in GRADES:
            c = len(os.listdir(os.path.join(OUT_DIR, split, g)))
            counts.append(f"{g}: {c}")
            total += c
        print(f"  {split.upper()}: {total} images ({', '.join(counts)})")

if __name__ == '__main__':
    prepare()
