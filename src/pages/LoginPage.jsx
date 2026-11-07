import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Login from './Login';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);

  const isRegisterParam = searchParams.get('register') === 'true';

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 200);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    navigate(location.state?.from || '/', { replace: true });
  };

  return (
    <Login
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      initialRegister={isRegisterParam}
    />
  );
};

export default LoginPage;