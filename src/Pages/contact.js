import React, { Component } from 'react'
import './contact.css'
export class contact extends Component {
  render() {
    return (
      <div className='contact'>
        <div className='contact__header'>Contact Me</div>
        <div class="social-icons">
          <a class="item fa fa-envelope" href="/contact">aneeshsharma0671@gmail.com</a>
          <a class="item fa fa-linkedin" href="/contact">My linkedin</a>
          <a class="item fa fa-twitter" href="/contact">My twitter</a>
          <a class="item fa fa-youtube" href="/contact">my youtube</a>
        </div>
      </div>
    )
  }
}

export default contact