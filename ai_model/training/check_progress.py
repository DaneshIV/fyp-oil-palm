import pandas as pd
df = pd.read_csv('ai_model/runs/oil_palm_v4/results.csv')
df.columns = df.columns.str.strip()
col_map50 = 'metrics/mAP50(B)'
col_map5095 = 'metrics/mAP50-95(B)'
print('Epoch  mAP50   mAP50-95')
print('-' * 30)
for i, row in df.iterrows():
    print(f"  {int(i+1):3d}    {row[col_map50]:.3f}    {row[col_map5095]:.3f}")
best = df[col_map50].max()
best_epoch = df[col_map50].idxmax() + 1
print(f"\nBest mAP50:  {best:.3f} at epoch {best_epoch}")
print(f"V3 was:      0.715")
print(f"Improvement: +{(best-0.715)*100:.1f}%")
print(f"Epochs done: {len(df)}")
