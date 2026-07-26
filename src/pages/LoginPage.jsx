import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Login from './Login';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);

  const isRegisterParam = searchParams.get('register') === 'true';

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      navigate(-1);
    }, 200);
  };

  return <Login isOpen={isOpen} onClose={handleClose} initialRegister={isRegisterParam} />;
};

export default LoginPage;