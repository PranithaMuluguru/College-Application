import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const AddItemModal = ({
  visible,
  onClose,
  onSave,
  title,
  fields,
  item,
  setItem
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          {fields.map((field) => (
            <TextInput
              key={field.key}
              style={styles.input}
              placeholder={field.placeholder}
              value={item[field.key]}
              onChangeText={(text) => setItem({...item, [field.key]: text})}
            />
          ))}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d3748',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#4a5568',
    fontWeight: '600',
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4a86e8',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default AddItemModal;