import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => void; 
  color?: string;
  type?: "button" | "submit" | "reset";
  // Add this line below:
  disabled?: boolean; 
}

// Destructure 'disabled' from props and pass it to the <button> element
const Button = ({ text, onClick, color = "blue", type = "button", disabled = false }: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled} // Pass it here
      style={{
        backgroundColor: disabled ? '#ccc' : color, // Optional: Grey out if disabled
        color: 'white',
        padding: '10px 15px',
        border: 'none',
        borderRadius: '5px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1
      }}
    >
      {text}
    </button>
  );
};

export default Button;