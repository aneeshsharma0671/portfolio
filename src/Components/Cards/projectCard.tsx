//----------
//Components
//----------
import React from 'react';

interface CardProps {
  img: string;
  title: string;
  author: string;
  link: string;
}

const Card: React.FC<CardProps> = ({ img, title, author, link }) => {
  return (
    <div className="card">
      <a href={link}>
        <img src={img} />
        <div className="card-body">
          <h2>{title}</h2>
          <h5>{author}</h5>
        </div>
      </a>
    </div>
  );
};

export default Card;