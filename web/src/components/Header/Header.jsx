import React from 'react';
import { Icon } from 'antd';
import Logo from './Logo/Logo';
import './Header.scss';
import ErrorSelector from '../ErrorSelector/ErrorSelector';

function Header() {
  return (
    <header className="Header-header">
      <div className="Header-logo">
        <Logo />
      </div>
      <h2 className="Header-title">REDCap Linter</h2>
      <ErrorSelector />
      <div className="Header-github">
        <a className="issue-tracker" target="_blank" href="https://github.mskcc.org/health-informatics/redcap-linter/issues">
          <Icon className="Header-githubIcon" type="github" height="70px" />
          <div style={{ fontSize: '11pt' }}>Issue Tracker</div>
        </a>
      </div>
    </header>
  );
}

export default Header;
