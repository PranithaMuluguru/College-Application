import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ScheduleView = ({ title, items, emptyMessage, onEdit, onAdd, onDelete, renderItem }) => {
  // Add safety check
  if (!items) {
    items = [];
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons name="create-outline" size={22} color="#4a86e8" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {items && items.length > 0 ? (
        items.map((item) => (
          <View key={item.id} style={styles.item}>
            {renderItem({ item })}  {/* Pass as object with item property */}
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color="#e53e3e" />
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color="#cbd5e0" />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
          {onAdd && (
            <TouchableOpacity style={styles.addButton} onPress={onAdd}>
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a86e8',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebf4ff',
    padding: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#4a86e8',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#a0aec0',
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#4a86e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ScheduleView;