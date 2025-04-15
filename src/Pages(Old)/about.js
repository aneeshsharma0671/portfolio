import React, { Component } from 'react'
import './pages.css'

export class about extends Component {
  render() {
    return (
        <div className='Main-Div'>
          <div className='header'>About Me</div>
            <div class="social-icons">
              <a class="item fa fa-file-text-o" href='https://drive.google.com/file/d/1Zt3iNiLZVnSzQOrWsQv5lQB2DICa5tLw/view?usp=sharing'>Resume</a>
            </div>
        </div>
    )
  }
}

export default about