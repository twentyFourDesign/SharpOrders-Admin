import React, {useEffect, useState} from 'react';
import DatePicker from 'react-native-date-picker';
import {Platform, View, StyleSheet} from 'react-native';

const DateTimePickerCom = ({onDateChange, show, setShow, initialDate}) => {
  const [date, setDate] = useState(initialDate || new Date());

  useEffect(() => {
    if (initialDate instanceof Date) {
      setDate(initialDate);
    } else if (initialDate) {
      const parsed = new Date(initialDate);
      if (!isNaN(parsed.getTime())) {
        setDate(parsed);
      }
    }
  }, [initialDate]);

  const today = new Date();
  const eighteenYearsAgo = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  const handleConfirm = selectedDate => {
    setShow(false);
    if (selectedDate && onDateChange) {
      setDate(selectedDate);
      onDateChange(selectedDate);
    }
  };

  const handleCancel = () => {
    setShow(false);
  };

  // For Web, we use a hidden HTML5 input[type="date"]
  if (Platform.OS === 'web') {
    if (!show) return null;

    const formattedDate = date.toISOString().split('T')[0];
    const maxDate = eighteenYearsAgo.toISOString().split('T')[0];

    return (
      <View style={styles.webPickerContainer}>
        <input
          type="date"
          value={formattedDate}
          max={maxDate}
          onChange={e => {
            const newDate = new Date(e.target.value);
            if (!isNaN(newDate.getTime())) {
              handleConfirm(newDate);
            }
          }}
          onBlur={handleCancel}
          style={styles.webInput}
          autoFocus
        />
      </View>
    );
  }

  return (
    <DatePicker
      modal
      open={show}
      date={date}
      mode="date"
      maximumDate={eighteenYearsAgo}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      locale={Platform.OS === 'ios' ? undefined : 'en'}
    />
  );
};

const styles = StyleSheet.create({
  webPickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
  },
  webInput: {
    padding: 20,
    fontSize: 18,
    borderRadius: 8,
    borderWidth: 0,
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
});

export default DateTimePickerCom;
