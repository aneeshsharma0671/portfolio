import React from "react";
import { BoidConfig } from "./types";
import styles from "./BoidsScene.module.css";

interface ControlsProps {
  config: BoidConfig;
  onConfigChange: (config: BoidConfig) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  config,
  onConfigChange,
}) => {
  const updateConfig = (updates: Partial<BoidConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className={styles.controls}>
      <h3>Controls</h3>

      <div className={styles.controlGroup}>
        <label>
          <span>Speed</span>
          <span className={styles.valueDisplay}>
            {config.maxSpeed.toFixed(2)}
          </span>
        </label>
        <input
          type="range"
          min="0.05"
          max="0.3"
          step="0.01"
          value={config.maxSpeed}
          onChange={(e) =>
            updateConfig({ maxSpeed: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Force</span>
          <span className={styles.valueDisplay}>
            {config.maxForce.toFixed(3)}
          </span>
        </label>
        <input
          type="range"
          min="0.001"
          max="0.01"
          step="0.001"
          value={config.maxForce}
          onChange={(e) =>
            updateConfig({ maxForce: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Separation</span>
          <span className={styles.valueDisplay}>
            {config.separationWeight.toFixed(1)}
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={config.separationWeight}
          onChange={(e) =>
            updateConfig({ separationWeight: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Alignment</span>
          <span className={styles.valueDisplay}>
            {config.alignmentWeight.toFixed(1)}
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={config.alignmentWeight}
          onChange={(e) =>
            updateConfig({ alignmentWeight: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Cohesion</span>
          <span className={styles.valueDisplay}>
            {config.cohesionWeight.toFixed(1)}
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={config.cohesionWeight}
          onChange={(e) =>
            updateConfig({ cohesionWeight: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Mouse Seek</span>
          <span className={styles.valueDisplay}>
            {config.mouseWeight.toFixed(1)}
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={config.mouseWeight}
          onChange={(e) =>
            updateConfig({ mouseWeight: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.showBoundaries}
            onChange={(e) => updateConfig({ showBoundaries: e.target.checked })}
          />
          <span>Show Boundaries</span>
        </label>
      </div>
    </div>
  );
};
