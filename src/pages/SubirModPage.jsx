import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SubirMod from './SubirMod';

const SubirModPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const editId = searchParams.get('edit');
  
  useEffect(() => {
    if (editId) {
      setIsOpen(true);
    } else {
      setIsOpen(true);
    }
  }, [editId]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  return <SubirMod isOpen={isOpen} onClose={handleClose} editId={editId} />;
};

export default SubirModPage;
