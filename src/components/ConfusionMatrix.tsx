import React from 'react';

export const ConfusionMatrix: React.FC = () => {
  const labels = ['Pothole', 'Drain', 'Stairs', 'Pole', 'Vehicle', 'Clear'];
  // Normalized confusion matrix values (%) on Indian Road validation test set
  const matrix = [
    [93, 2, 1, 1, 0, 3],  // Pothole
    [3, 94, 0, 1, 0, 2],  // Drain
    [0, 1, 96, 1, 0, 2],  // Stairs
    [1, 1, 2, 89, 4, 3],  // Pole
    [0, 0, 0, 3, 92, 5],  // Vehicle
    [2, 1, 1, 1, 2, 93],  // Clear
  ];

  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4">
        <h3 className="text-base font-bold text-[var(--ink)]">
          Confusion Matrix (Validation Test Set, n=2,400 frames)
        </h3>
        <p className="text-xs text-[var(--ink-muted)]">
          Rows represent actual ground-truth hazards; columns represent model predictions.
        </p>
      </div>

      <table className="w-full text-center text-xs font-mono border-collapse" aria-label="Model Confusion Matrix">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="py-2.5 px-3 text-left font-sans text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">
              Actual \ Predicted
            </th>
            {labels.map((l) => (
              <th key={l} className="py-2.5 px-2 font-bold text-[var(--ink)]">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((rowLabel, rIdx) => (
            <tr key={rowLabel} className="border-b border-[var(--border-subtle)]">
              <td className="py-2.5 px-3 text-left font-sans font-semibold text-[var(--ink)]">
                {rowLabel}
              </td>
              {matrix[rIdx].map((val, cIdx) => {
                const isDiagonal = rIdx === cIdx;
                const heatOpacity = isDiagonal ? val / 100 : val / 20;
                return (
                  <td
                    key={cIdx}
                    className="py-2 px-2 tabular-data"
                    style={{
                      backgroundColor: isDiagonal
                        ? `rgba(31, 79, 216, ${Math.max(0.12, heatOpacity * 0.28)})`
                        : val > 2
                        ? `rgba(180, 35, 24, ${heatOpacity * 0.2})`
                        : 'transparent',
                      color: isDiagonal ? 'var(--accent)' : 'var(--ink)',
                      fontWeight: isDiagonal ? 700 : 400,
                    }}
                  >
                    {val}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
