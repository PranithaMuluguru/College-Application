import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.32.9.125:8000'; // replace with your backend IP

const AcademicsScreen = ({ userId }) => {
  const [timetable, setTimetable] = useState({});
  const [grades, setGrades] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [cgpa, setCgpa] = useState(0);

  const [newTimetableEntry, setNewTimetableEntry] = useState({
    day: '',
    class_name: '',
    start_time: '',
    end_time: '',
    teacher: '',
    room: '',
    exam_date: '',
  });

  const [newGrade, setNewGrade] = useState({
    course_name: '',
    credits: '',
    grade: '',
  });

  // Fetch timetable
  const fetchTimetable = async () => {
    try {
      const res = await axios.get(`${API_URL}/timetable/${userId}`);
      const organized = {};
      res.data.forEach(item => {
        if (!organized[item.day]) organized[item.day] = [];
        organized[item.day].push(item);
      });
      setTimetable(organized);
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch grades & CGPA
  const fetchGrades = async () => {
    try {
      const res = await axios.get(`${API_URL}/grades/${userId}`);
      setGrades(res.data);

      const cgpaRes = await axios.get(`${API_URL}/grades/cgpa/${userId}`);
      setTotalCredits(cgpaRes.data.total_credits);
      setCgpa(cgpaRes.data.cgpa);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTimetable();
    fetchGrades();
  }, []);

  // Add timetable entry
  const addTimetableEntry = async () => {
    try {
      await axios.post(`${API_URL}/timetable/`, { user_id: userId, ...newTimetableEntry });
      setNewTimetableEntry({
        day: '', class_name: '', start_time: '', end_time: '', teacher: '', room: '', exam_date: ''
      });
      fetchTimetable();
      Alert.alert('Success', 'Timetable entry added');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to add entry');
    }
  };

  // Add grade
  const addGrade = async () => {
    try {
      await axios.post(`${API_URL}/grades/`, { user_id: userId, ...newGrade });
      setNewGrade({ course_name: '', credits: '', grade: '' });
      fetchGrades();
      Alert.alert('Success', 'Grade added');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to add grade');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Class Schedule</Text>

      {Object.entries(timetable).map(([day, classes]) => (
        <View key={day} style={styles.dayCard}>
          <Text style={styles.dayTitle}>{day}</Text>
          {classes.length > 0 ? (
            classes.map((cls) => (
              <View key={cls.id} style={styles.classItem}>
                <Text style={styles.className}>{cls.class_name}</Text>
                <Text style={styles.classTime}>{cls.start_time} - {cls.end_time}</Text>
                <Text style={styles.classLocation}>{cls.room} | {cls.teacher}</Text>
                {cls.exam_date && <Text style={styles.classExam}>Exam: {new Date(cls.exam_date).toLocaleDateString()}</Text>}
              </View>
            ))
          ) : (
            <Text style={styles.noClass}>No classes scheduled</Text>
          )}
        </View>
      ))}

      <Text style={styles.header}>Add Timetable Entry</Text>
      {['day','class_name','start_time','end_time','teacher','room','exam_date'].map(field => (
        <TextInput
          key={field}
          placeholder={field.replace('_',' ')}
          value={newTimetableEntry[field]}
          onChangeText={text => setNewTimetableEntry({...newTimetableEntry, [field]: text})}
          style={styles.input}
        />
      ))}
      <Button title="Add Entry" onPress={addTimetableEntry} />

      <Text style={styles.header}>Semester Grades</Text>
      {grades.map(g => (
        <View key={g.id} style={styles.gradeItem}>
          <Text>{g.course_name} | Credits: {g.credits} | Grade: {g.grade}</Text>
        </View>
      ))}

      <Text style={styles.header}>Add Grade</Text>
      {['course_name','credits','grade'].map(field => (
        <TextInput
          key={field}
          placeholder={field.replace('_',' ')}
          value={newGrade[field]}
          onChangeText={text => setNewGrade({...newGrade, [field]: text})}
          style={styles.input}
        />
      ))}
      <Button title="Add Grade" onPress={addGrade} />

      <View style={{marginTop: 20, padding: 10, backgroundColor: '#fff', borderRadius: 10}}>
        <Text style={{fontWeight:'bold'}}>Total Credits: {totalCredits}</Text>
        <Text style={{fontWeight:'bold'}}>CGPA: {cgpa}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { fontSize: 22, fontWeight: 'bold', marginVertical: 15, textAlign: 'center', color:'#4a86e8' },
  dayCard: { backgroundColor:'white', padding:15, borderRadius:10, marginBottom:15, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:4, elevation:2 },
  dayTitle: { fontSize:18, fontWeight:'bold', marginBottom:10, color:'#4a86e8' },
  classItem: { marginBottom:12, paddingBottom:12, borderBottomWidth:1, borderBottomColor:'#eee' },
  className: { fontWeight:'600', fontSize:16, marginBottom:4 },
  classTime: { color:'#555', marginBottom:2 },
  classLocation: { color:'#777', fontSize:12 },
  classExam: { color:'#d9534f', fontSize:12 },
  noClass: { fontStyle:'italic', color:'#999', textAlign:'center', marginVertical:10 },
  input: { backgroundColor:'#fff', padding:10, borderRadius:8, marginBottom:10, borderWidth:1, borderColor:'#ccc' },
  gradeItem: { backgroundColor:'#fff', padding:10, borderRadius:8, marginBottom:5 }
});

export default AcademicsScreen;
