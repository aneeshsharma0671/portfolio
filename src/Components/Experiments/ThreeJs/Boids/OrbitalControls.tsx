import React from "react";
import { OrbitalBoidConfig } from "./orbitalBoidConfig";
import styles from "./BoidsScene.module.css";

interface OrbitalControlsProps {
  config: OrbitalBoidConfig;
  onConfigChange: (config: OrbitalBoidConfig) => void;
}

export const OrbitalControls: React.FC<OrbitalControlsProps> = ({
  config,
  onConfigChange,
}) => {
  const updateConfig = (updates: Partial<OrbitalBoidConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className={styles.controls}>
      <h3>Orbital Controls</h3>

      <div className={styles.controlGroup}>
        <label>
          <span>Plane Count</span>
          <span className={styles.valueDisplay}>{config.count}</span>
        </label>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={config.count}
          onChange={(e) => updateConfig({ count: parseInt(e.target.value) })}
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Min Orbit Radius</span>
          <span className={styles.valueDisplay}>
            {config.orbitRadiusMin.toFixed(1)}
          </span>
        </label>
        <input
          type="range"
          min="2"
          max="10"
          step="0.5"
          value={config.orbitRadiusMin}
          onChange={(e) =>
            updateConfig({ orbitRadiusMin: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Max Orbit Radius</span>
          <span className={styles.valueDisplay}>
            {config.orbitRadiusMax.toFixed(1)}
          </span>
        </label>
        <input
          type="range"
          min="5"
          max="20"
          step="0.5"
          value={config.orbitRadiusMax}
          onChange={(e) =>
            updateConfig({ orbitRadiusMax: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Min Orbit Speed</span>
          <span className={styles.valueDisplay}>
            {config.orbitSpeedMin.toFixed(4)}
          </span>
        </label>
        <input
          type="range"
          min="0.0001"
          max="0.002"
          step="0.0001"
          value={config.orbitSpeedMin}
          onChange={(e) =>
            updateConfig({ orbitSpeedMin: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Max Orbit Speed</span>
          <span className={styles.valueDisplay}>
            {config.orbitSpeedMax.toFixed(4)}
          </span>
        </label>
        <input
          type="range"
          min="0.0005"
          max="0.01"
          step="0.0001"
          value={config.orbitSpeedMax}
          onChange={(e) =>
            updateConfig({ orbitSpeedMax: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label>
          <span>Earth Rotation Speed</span>
          <span className={styles.valueDisplay}>
            {config.earthRotationSpeed.toFixed(4)}
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="0.002"
          step="0.0001"
          value={config.earthRotationSpeed}
          onChange={(e) =>
            updateConfig({ earthRotationSpeed: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.rotation}
            onChange={(e) => updateConfig({ rotation: e.target.checked })}
          />
          <span>Rotate Earth</span>
        </label>
      </div>
    </div>
  );
};
