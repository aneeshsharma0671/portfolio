import React, { Component,useRef} from 'react'
import './Background.css';
import mt1 from './mt1.svg'
import mt2 from './mt2.svg'
import mt3 from './mt3.svg'
import cd1 from './Cloud1.svg'
import cd2 from './Cloud2.svg'
import cd3 from './Cloud3.svg'
import cd4 from './Cloud4.svg'
export class BackGround extends Component {

  
  componentDidMount() {
    document.addEventListener("mousemove", this.parallax);
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.parallax);
  }

  parallax = (e) =>
  {
    document.querySelectorAll(".layer").forEach(element => {
      const speed = element.getAttribute("data-speed");
      const x = (window.innerWidth - e.pageX * speed) / 100;
      const y = (window.innerHeight - e.pageY * speed*0.5) / 100;
      element.style.transform = "translateX(" + -x + "px) translateY(" + y + "px)";
    });
  }

  // setCloud = () => {
  //   document.querySelectorAll(".cloud").forEach(element => {
  //     console.log("setCloud");
  //     element.style.setProperty("--cloud-anim-time",0);
  //   });
  // }
  render() {   
    return (
        <div className='Background'>
          <div className='mt-2'>
            <img src={mt2} class ='layer' data-speed ='1'></img>
          </div>
          <div className='mt-1'>
            <img src={mt1} class ='layer' data-speed ='0.5'></img>
          </div>
          <div className='mt-3'>
            <img src={mt3} class ='layer' data-speed ='1'></img>
          </div>
          <img src={cd1} class ='cloud1'></img>
          <img src={cd2} class ='cloud2'></img>
          <img src={cd3} class ='cloud3'></img>
          <img src={cd4} class ='cloud4'></img>
        </div>
    )
  }
}

export default BackGround