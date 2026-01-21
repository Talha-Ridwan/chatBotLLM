import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  color?: string;
  type?: "button" | "submit" | "reset";
}

const Button = ({ text, onClick, color = "blue", type = "button" }: ButtonProps) => {
  const buttonStyle: React.CSSProperties = {
    backgroundColor: color,
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px'
  };

  return (
    <button style={buttonStyle} onClick={onClick} type={type}>
      {text}
    </button>
  );
};

export default Button;