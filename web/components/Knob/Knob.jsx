import styles from './Knob.module.css';

/**
 * @typedef {Object} KnobProps
 * @property {boolean} disabled - Whether the knob is disabled or not
 * @property {string} ariaLabel - The aria-label for the knob
 * @property {boolean} selected - Whether the knob is selected or not
 * @property {string} tone - Currently only supports 'default' or 'critical'
 * @property {() => void} onClick - The function to call when the knob is clicked
 */

/**
 * Knob component
 * @param {KnobProps} props - The props for the Knob component
 * @returns {JSX.Element} The rendered Knob component
 */
export const Knob = ({ 
  disabled,
  ariaLabel, 
  selected, 
  tone, 
  onClick 
}) => {
  return (
    <button
      id=':rgi:'
      className={`${styles.track} ${selected && styles.track_on} ${tone === 'critical' && styles.track_critical} ${disabled && styles.track_disabled}`}
      aria-label={ariaLabel}
      role='switch'
      type='button'
      aria-checked={selected}
      onClick={disabled ? null : onClick}
      disabled={disabled}
    >
      <div className={`${styles.knob} ${selected && styles.knob_on}`}></div>
    </button>
  );
};