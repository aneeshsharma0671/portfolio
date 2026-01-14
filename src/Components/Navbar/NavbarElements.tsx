import { FaBars, FaCross } from 'react-icons/fa';
import Link from 'next/link';
import styled from 'styled-components';

interface SidebarProps {
  isOpen: boolean;
}

export const Nav = styled.nav`
position : relative;
background-color: transparent;
height: 10vh;
margin-left : 10vw;
margin-right : 10vw;
display: flex;
align-items: center;
justify-content: space-between;
z-index: 12;
`;

export const Sidebar = styled.div<SidebarProps>`
position : absolute;
background-color: #DFECE8;
height: 100vh;
width: 100vw;
opacity: ${props => props.isOpen === true ? 1 : 0};
overflow : hidden;
transition: 0.5s;
display: ${props => props.isOpen === true ? 'flex' : 'none'};
z-index: 12;
`;

export const NavList = styled.ul`
display: flex-row;
height: 100%;
width: 100%;
overflow-y: scroll;
list-style: none;
justify-content: center;
align-items: center;
text-align: center;
font-size: 10vw;
padding: 0;
padding-inline-start: 0;
font-family: 'Pacifico', cursive;
`;


export const IconContainer = styled.div`
display: none;
color: darkcyan;
@media screen and (max-width: 768px) {
	display: flex;
	top: 0;
	right: 0;
	font-size: 2.2rem;
	cursor: pointer;s
}
`;

export const NavMenu = styled.div`
display: flex;
align-items: center;
margin-right: 5vw;
margin-left: 5vw;
@media screen and (max-width: 768px) {
	display: none;
}
`;

export const NavBtn = styled.nav`
display: flex;
align-items: center;
margin-right: 24px;
/* Third Nav */
/* justify-content: flex-end;
width: 100vw; */
@media screen and (max-width: 768px) {
	display: none;
}
`;

export const NavBtnLink = styled(Link)`
border-radius: 4px;
background: #808080;
padding: 10px 22px;
color: #000000;
outline: none;
border: none;
cursor: pointer;
transition: all 0.2s ease-in-out;
text-decoration: none;
/* Second Nav */
margin-left: 24px;
&:hover {
	transition: all 0.2s ease-in-out;
	background: #fff;
	color: #808080;
}
`;
