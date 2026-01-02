import React from 'react';

type CheckboxProps = {
  id?: string;
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (v: boolean | 'indeterminate') => void;
  className?: string;
};

export const Checkbox: React.FC<CheckboxProps> = ({ id, checked = false, onCheckedChange, className }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onCheckedChange) return;
    onCheckedChange(e.target.checked);
  };

  return (
    <input
      id={id}
      type="checkbox"
      checked={checked === 'indeterminate' ? false : !!checked}
      onChange={handleChange}
      className={className}
      aria-checked={checked === 'indeterminate' ? 'mixed' : !!checked}
    />
  );
};

export default Checkbox;