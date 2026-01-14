import React, { useEffect } from 'react';

const BackGround: React.FC = () => {
  useEffect(() => {
    const parallax = (e: MouseEvent) => {
      document.querySelectorAll(".layer").forEach(element => {
        const speed = parseFloat(element.getAttribute("data-speed") || "0");
        const x = (window.innerWidth - e.pageX * speed) / 100;
        const y = (window.innerHeight - e.pageY * speed * 0.5) / 100;
        (element as HTMLElement).style.transform = `translateX(${-x}px) translateY(${y}px)`;
      });
    };

    document.addEventListener("mousemove", parallax);
    return () => {
      document.removeEventListener("mousemove", parallax);
    };
  }, []);

  return (
    <div className='Background'>
      <div className='mt-2'>
        <img src='/mt2.svg' className='layer' data-speed='1' />
      </div>
      <div className='mt-1'>
        <img src='/mt1.svg' className='layer' data-speed='0.5' />
      </div>
      <div className='mt-3'>
        <img src='/mt3.svg' className='layer' data-speed='1' />
      </div>
      <img src='/Cloud1.svg' className='cloud1' />
      <img src='/Cloud2.svg' className='cloud2' />
      <img src='/Cloud3.svg' className='cloud3' />
      <img src='/Cloud4.svg' className='cloud4' />
    </div>
  );
};

export default BackGround;