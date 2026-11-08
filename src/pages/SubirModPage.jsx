import React, { useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import SubirMod from './SubirMod';

const SubirModPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  
  const editId = searchParams.get('edit');

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      navigate(location.state?.returnTo || '/', { replace: true });
    }, 200);
  };

  return <SubirMod isOpen={isOpen} onClose={handleClose} editId={editId} />;
};

export default SubirModPage;
