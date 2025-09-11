import './App.css';
import { HashRouter as Router,Routes, Route } from 'react-router-dom';
import Home from './Pages/home';
import Projects from './Pages/projects';
import About from './Pages/about';
import Contact from './Pages/contact';
import NavbarOLD from './Components/Navbar(Old)/index';
import BackGround from './Components/Background(Old)';
import Navbar from './Components/Navbar';

function App(){
  return (
    <div>
      <Navbar />
      <Router>
        {/* <BackGround /> */}
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/projects' element={<Projects />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} /> 
        </Routes>
      </Router>
    </div>
  );
}

export default App;
