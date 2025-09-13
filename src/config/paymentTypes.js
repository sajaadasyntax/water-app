// Payment Types Configuration
export const PAYMENT_TYPES = {
  SMALL_METER: {
    id: 'SMALL_METER',
    name: 'عداد صغير',
    amount: 5000, // 5000 جنيه سوداني
    color: '#4CAF50',
  },
  MEDIUM_METER: {
    id: 'MEDIUM_METER', 
    name: 'عداد متوسط',
    amount: 10000, // 10000 جنيه سوداني
    color: '#FF9800',
  },
  LARGE_METER: {
    id: 'LARGE_METER',
    name: 'عداد كبير', 
    amount: 15000, // 15000 جنيه سوداني
    color: '#F44336',
  },
};

export const getPaymentTypeById = (id) => {
  return Object.values(PAYMENT_TYPES).find(type => type.id === id);
};

export const getPaymentTypeName = (id) => {
  const type = getPaymentTypeById(id);
  return type ? type.name : 'غير محدد';
};

export const getPaymentAmount = (id) => {
  const type = getPaymentTypeById(id);
  return type ? type.amount : 0;
};
