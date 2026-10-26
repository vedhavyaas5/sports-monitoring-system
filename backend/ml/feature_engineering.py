"""
Scientifically-sound feature engineering for physical movement and wearable physiological data.
Transforms raw sensor metrics into domain-relevant strain and stability features.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any

def engineer_movement_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    # 1. Movement Intensity: Angular velocity x Linear acceleration
    if 'angular_velocity' in df.columns and 'linear_acceleration' in df.columns:
        df['movement_intensity'] = df['angular_velocity'] * df['linear_acceleration']
    else:
        df['movement_intensity'] = 0.0
        
    # 2. Biomechanical Risk Index: Combined instability and deviation
    if 'postural_instability_index' in df.columns and 'biomechanical_deviation_score' in df.columns:
        df['biomechanical_risk_index'] = (
            0.5 * df['postural_instability_index'] + 
            0.5 * df['biomechanical_deviation_score']
        )
    else:
        df['biomechanical_risk_index'] = 0.0
        
    # 3. Movement Asymmetry Indicator (if lateral joints provided)
    if 'l_knee_angle' in df.columns and 'r_knee_angle' in df.columns:
        df['movement_asymmetry'] = (df['l_knee_angle'] - df['r_knee_angle']).abs()
    elif 'hip_flexion_angle' in df.columns and 'knee_flexion_angle' in df.columns:
        df['movement_asymmetry'] = (df['hip_flexion_angle'] * 0.5 - df['knee_flexion_angle'] * 0.5).abs().clip(0, 45)
    else:
        df['movement_asymmetry'] = 0.0
        
    # 4. Fatigue - Ground Reaction Force Interaction
    if 'fatigue_level' in df.columns and 'ground_reaction_force' in df.columns:
        df['fatigue_grf_interaction'] = df['fatigue_level'] * df['ground_reaction_force']
    else:
        df['fatigue_grf_interaction'] = 0.0
        
    return df

def engineer_sensor_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    # 1. Fatigue Adjusted Load
    if 'training_load' in df.columns and 'sensor_fatigue_index' in df.columns:
        df['fatigue_adjusted_load'] = df['training_load'] * (1.0 + df['sensor_fatigue_index'])
    else:
        df['fatigue_adjusted_load'] = 0.0
        
    # 2. Composite Physiological Stress Score
    hr = df.get('heart_rate_bpm', 120.0)
    spo2 = df.get('oxygen_saturation_spo2', 98.0)
    stress = df.get('stress_index', 0.4)
    
    hr_norm = ((hr - 55.0) / 135.0).clip(0.0, 1.0)
    spo2_inv = (1.0 - ((spo2 - 90.0) / 10.0)).clip(0.0, 1.0)
    df['physiological_stress_score'] = 0.4 * hr_norm + 0.3 * spo2_inv + 0.3 * stress
    
    # 3. Recovery Indicator Index
    hyd = df.get('hydration_level', 0.7)
    df['recovery_index'] = (hyd * (1.0 - stress)).clip(0.0, 1.0)
    
    # 4. Cardiovascular Load Product
    df['cardiovascular_load'] = hr * df.get('training_load', 200.0)
    
    return df
