import React from 'react';
import { CircleLoader } from 'react-spinners';
import logo from '../assets/images/icons/logo.png';
import './BusinessSuiteLoader.css';

const BusinessSuiteLoader = ({ message = 'switching to business suite' }) => {
  return (
    <div className="business-suite-loader-overlay">
      <div className="business-suite-loader-content">
        <img src={logo} alt="TrustiChain" className="business-suite-loader-logo" />
        <div className="business-suite-loader-spinner">
          <CircleLoader color="#2F74FF" size={60} />
        </div>
        <p className="business-suite-loader-text">{message}</p>
      </div>
    </div>
  );
};

export default BusinessSuiteLoader;
