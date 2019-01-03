import React, { Component } from 'react';
import Logo from './Logo/Logo';
import './Header.css'

class Header extends Component {
  render() {
    return (
    	<header className="Header-header">
          <div className="Header-logo">
            <Logo />
          </div>
          <h2 className="Header-title">REDCap Linter</h2>
        </header>
    	);
	}
}

export default Header;