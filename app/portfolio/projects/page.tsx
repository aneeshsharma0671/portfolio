import Card from '../../../src/Components/Cards/projectCard';

export default function Projects() {
  const projectLogos = ['/ProjectLogos/Pandemic.png','/ProjectLogos/Flappy.png','/ProjectLogos/EduAR.png','/ProjectLogos/Office.png'];

  return (
    <div className='projects'>
      <div className='projects__header'>Projects</div>
      <div className='cards'>
        <Card img={projectLogos[0]} title='Pandemic Simulator' author='Unity' link='https://aneesh-sharma.itch.io/pandemic-simulator'/>
        <Card img={projectLogos[1]} title='Flappy Bird AI' author='Unity' link='https://aneesh-sharma.itch.io/flappy-bird-ai' />
        <Card img={projectLogos[2]} title='EduAR' author='Unity' link='https://aneesh-sharma.itch.io/education-with-ar' />
        <Card img={projectLogos[3]} title='DCS IIIT Sonepat' author='ReactJs' link='https://dsciiitsonepat.github.io/dsc-iiits/'/>
      </div>
    </div>
  );
}
