//----------
//Components
//----------
import React from 'react';
import './projectCard.css';

class Card extends React.Component {
    render() {
      return(
          <div className="card">
            <a href={this.props.link}>
              <img src={this.props.img} />
              <div className="card-body">
                <h2>{this.props.title}</h2>
                {/* <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p> */}
                <h5>{this.props.author}</h5>
              </div>
            </a>
          </div>
      )
    }
}
export default Card;