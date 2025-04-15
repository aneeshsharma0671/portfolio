import React, { Component } from 'react'
import './pages.css'
export class contact extends Component {
  render() {
    return (
      <div className='Main-Div'>
        <div className='header'>Contact Me</div>
        <div class="social-icons">
          <a class="item fa fa-envelope" href='mailto:aneeshsharma0671@gmail.com'>Mail-To</a>
          <a class="item fa fa-linkedin" href="https://www.linkedin.com/in/aneeshsharma0671/">linkedin</a>
          <a class="item fa fa-github" href="https://github.com/aneeshsharma0671">Github</a>
        </div>
      </div>
    )
  }
}

export default contact