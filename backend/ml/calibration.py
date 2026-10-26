"""
Probability Calibration and Brier Score Verification.
Ensures model-reported probabilities accurately reflect observed risk frequencies.
"""
import numpy as np
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss

def calibrate_model(model, X_train, y_train, method='isotonic'):
    calibrator = CalibratedClassifierCV(estimator=model, method=method, cv=3)
    calibrator.fit(X_train, y_train)
    return calibrator

def compute_calibration_metrics(y_true, probas):
    brier = float(brier_score_loss(y_true, probas))
    prob_true, prob_pred = calibration_curve(y_true, probas, n_bins=10)
    return {
        "brier_score": round(brier, 4),
        "prob_true": [round(float(v), 4) for v in prob_true],
        "prob_pred": [round(float(v), 4) for v in prob_pred],
        "is_well_calibrated": brier < 0.15
    }
