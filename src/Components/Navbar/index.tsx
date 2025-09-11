import React, { useState, useEffect } from 'react';

// Removed duplicate declaration
const baseStyles = {
	navbar: {
		width: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'linear-gradient(to bottom, #f5f5f5 80%, #e0e0e0 100%)',
		padding: '0',
		minHeight: '90px',
		position: 'relative',
		boxSizing: 'border-box' as React.CSSProperties['boxSizing'],
		zIndex: 100,
	} as React.CSSProperties,
		navContent: {
			width: '100%',
			maxWidth: '1200px',
			display: 'grid',
			gridTemplateColumns: '1fr auto 1fr',
			alignItems: 'center',
			padding: '0 40px',
			boxSizing: 'border-box' as React.CSSProperties['boxSizing'],
			transition: 'padding 0.3s',
			gap: '0',
		} as React.CSSProperties,
	navSection: {
		display: 'flex',
		alignItems: 'center',
		gap: '32px',
		transition: 'gap 0.3s',
	} as React.CSSProperties,
	navLink: {
		fontFamily: 'Arial, Helvetica, sans-serif',
		fontWeight: 700,
		fontSize: '15px',
		color: '#222',
		textDecoration: 'none',
		letterSpacing: '0.5px',
		transition: 'color 0.2s',
		textTransform: 'uppercase' as React.CSSProperties['textTransform'],
		cursor: 'pointer',
		padding: '8px 0',
		display: 'block',
	} as React.CSSProperties,
	logoContainer: {
		background: '#222',
		borderRadius: '8px',
		padding: '0 36px',
		display: 'flex',
		alignItems: 'center',
		height: '90px',
		minWidth: '180px',
		justifyContent: 'center',
		margin: '0 32px',
		transition: 'margin 0.3s, padding 0.3s, height 0.3s',
	} as React.CSSProperties,
	logoText: {
		color: '#fff',
		fontFamily: 'Brush Script MT, cursive',
		fontSize: '2.2rem',
		fontWeight: 700,
		textAlign: 'center' as React.CSSProperties['textAlign'],
		lineHeight: 1.1,
		letterSpacing: '1px',
		whiteSpace: 'pre-line' as React.CSSProperties['whiteSpace'],
		userSelect: 'none' as React.CSSProperties['userSelect'],
	} as React.CSSProperties,
	hamburger: {
		display: 'none',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		width: '40px',
		height: '40px',
		background: 'none',
		border: 'none',
		cursor: 'pointer',
		zIndex: 200,
	} as React.CSSProperties,
	hamburgerBar: {
		width: '26px',
		height: '3px',
		background: '#222',
		margin: '4px 0',
		borderRadius: '2px',
		transition: 'all 0.3s',
	} as React.CSSProperties,
	mobileMenu: {
		position: 'fixed',
		top: 0,
		left: 0,
		width: '100vw',
		height: '100vh',
		background: 'rgba(255,255,255,0.98)',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 999,
		transition: 'opacity 0.3s',
	} as React.CSSProperties,
	mobileNavSection: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: '28px',
		margin: '18px 0',
	} as React.CSSProperties,
};

function useIsMobile(breakpoint = 800) {
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return isMobile;
}

const leftLinks = [
	{ label: 'NOSOTROS', href: '#' },
	{ label: 'BLENDS', href: '#' },
];
const rightLinks = [
	{ label: 'SIDRA', href: '#' },
	{ label: 'COMPRA ONLINE', href: '#' },
	{ label: 'CONTACTO', href: '#' },
];


const Navbar = () => {
	const isMobile = useIsMobile();
	const [menuOpen, setMenuOpen] = useState(false);

	// Merge responsive styles
	const styles = { ...baseStyles };
				if (isMobile) {
					styles.navContent = {
						...styles.navContent,
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '0 10px',
						position: 'relative',
						gap: 0,
					};
				styles.logoContainer = {
					...styles.logoContainer,
					margin: '0 8px',
					height: '60px',
					minWidth: '100px',
					padding: '0 10px',
					zIndex: 1001,
				};
				styles.navSection = {
					...styles.navSection,
					gap: '18px',
					flexDirection: 'row',
					alignItems: 'center',
					margin: '0',
					display: 'none', // hide nav links in nav bar on mobile
				};
				styles.logoText = {
					...styles.logoText,
					fontSize: '1.2rem',
				};
				styles.hamburger = {
					...styles.hamburger,
					display: 'flex',
					position: 'absolute',
					right: 18,
					top: 18,
					zIndex: 2001, // ensure hamburger is above overlay
				};
			} else {
				styles.hamburger = {
					...styles.hamburger,
					display: 'none',
				};
				styles.navSection = {
					...styles.navSection,
					display: 'flex',
				};
			}

		return (
			<nav style={styles.navbar}>
				{isMobile && (
					<button
						style={styles.hamburger}
						aria-label={menuOpen ? 'Close menu' : 'Open menu'}
						onClick={() => setMenuOpen(m => !m)}
					>
						<div style={{ ...styles.hamburgerBar, transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none' }} />
						<div style={{ ...styles.hamburgerBar, opacity: menuOpen ? 0 : 1 }} />
						<div style={{ ...styles.hamburgerBar, transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }} />
					</button>
				)}
				<div style={styles.navContent}>
							{/* Always show logo in center, links centered in their columns */}
							<div style={{ justifySelf: 'end', display: 'flex', justifyContent: 'center' }}>
								{!isMobile && (
									<div style={styles.navSection}>
										{leftLinks.map(link => (
											<a
												key={link.label}
												href={link.href}
												style={styles.navLink}
												onMouseOver={e => (e.currentTarget.style.color = '#000')}
												onMouseOut={e => (e.currentTarget.style.color = '#222')}
											>
												{link.label}
											</a>
										))}
									</div>
								)}
							</div>
							<div style={{ justifySelf: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
								<div style={styles.logoContainer}>
									<span style={styles.logoText}>
										Familia
										<br />
										Tipo
									</span>
								</div>
							</div>
							<div style={{ justifySelf: 'start', display: 'flex', justifyContent: 'center' }}>
								{!isMobile && (
									<div style={styles.navSection}>
										{rightLinks.map(link => (
											<a
												key={link.label}
												href={link.href}
												style={styles.navLink}
												onMouseOver={e => (e.currentTarget.style.color = '#000')}
												onMouseOut={e => (e.currentTarget.style.color = '#222')}
											>
												{link.label}
											</a>
										))}
									</div>
								)}
							</div>
					{/* Mobile menu overlay */}
							{isMobile && menuOpen && (
								<>
									<div style={baseStyles.mobileMenu}>
										<div style={baseStyles.mobileNavSection}>
											{leftLinks.map(link => (
												<a
													key={link.label}
													href={link.href}
													style={baseStyles.navLink}
													onClick={() => setMenuOpen(false)}
												>
													{link.label}
												</a>
											))}
										</div>
										<div style={baseStyles.mobileNavSection}>
											{rightLinks.map(link => (
												<a
													key={link.label}
													href={link.href}
													style={baseStyles.navLink}
													onClick={() => setMenuOpen(false)}
												>
													{link.label}
												</a>
											))}
										</div>
									</div>
									{/* Keep hamburger visible above overlay */}
									<button
										style={{ ...styles.hamburger, position: 'fixed', top: 18, right: 18 }}
										aria-label={menuOpen ? 'Close menu' : 'Open menu'}
										onClick={() => setMenuOpen(m => !m)}
									>
										<div style={{ ...styles.hamburgerBar, transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none' }} />
										<div style={{ ...styles.hamburgerBar, opacity: menuOpen ? 0 : 1 }} />
										<div style={{ ...styles.hamburgerBar, transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }} />
									</button>
								</>
							)}
				</div>
			</nav>
		);
};

export default Navbar;
