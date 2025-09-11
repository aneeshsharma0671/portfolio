import React,{useState} from 'react';
import {
Nav,
NavLink,
NavList,
NavMenu,
Sidebar,
IconContainer,
SidebarLink,
} from './NavbarElements';
import Logo from './LogoA.svg';
import './navbar.css';
import { FaBars} from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const[navbaropen,setNavbarOpen] = useState(false);
    const handleToggle = () => { setNavbarOpen(!navbaropen);}
return (
	<>
	<Nav>
        <Link to="/" onClick={()=>setNavbarOpen(false)} activeStyle><img src={Logo} alt="Aneesh"/></Link>
        <IconContainer onClick={handleToggle} >{navbaropen?<ImCross/>:<FaBars/>}</IconContainer>
		<NavMenu>
            <NavLink to='/projects' activeStyle>
                Projects
            </NavLink>
            <NavLink to='/about' activeStyle>
                About
            </NavLink>
            <NavLink to='/contact' activeStyle>
                Contact
            </NavLink>
		</NavMenu>
	</Nav>
    <Sidebar display={navbaropen}>
        <NavList>
            <li><SidebarLink to='/projects' onClick={handleToggle} activeStyle>Projects</SidebarLink></li>
            <li><SidebarLink to='/about' onClick={handleToggle} activeStyle>About</SidebarLink></li>
            <li><SidebarLink to='/contact' onClick={handleToggle} activeStyle>Contact</SidebarLink></li>
        </NavList>
    </Sidebar>
	</>
);
};

export default Navbar;
