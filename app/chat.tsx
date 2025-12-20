// app/chat.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import { API_URL } from '../src/constants/Config';
import { Colors, Shadows } from '../src/constants/theme';

interface Message {
  id?: number; request_id: number; sender_id: number; content: string; created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  
  const [socket, setSocket] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null); 

  useEffect(() => {
    if (!requestId) { router.back(); return; }
    const init = async () => {
      const u = await AsyncStorage.getItem('user');
      const userData = u ? JSON.parse(u) : null;
      setUser(userData);
      try {
        const response = await fetch(`${API_URL}/messages/${requestId}`);
        const historicData = await response.json();
        if (Array.isArray(historicData)) setMessages(historicData);
      } catch (e) {}
      
      const newSocket = io(API_URL);
      setSocket(newSocket);
      newSocket.on('connect', () => newSocket.emit('join_room', requestId));
      newSocket.on('receive_message', (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      });
    };
    init();
    return () => { if (socket) socket.disconnect(); };
  }, [requestId]);

  const scrollToBottom = () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

  const handleSend = () => {
    if (newMessage.trim() === '' || !socket || !user) return;
    const msgData: Message = {
      request_id: Number(requestId), sender_id: user.id, content: newMessage, created_at: new Date().toISOString()
    };
    socket.emit('send_message', msgData);
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.msgText, isMe ? styles.textMe : styles.textOther]}>{item.content}</Text>
          <Text style={[styles.time, isMe ? {color:'rgba(255,255,255,0.7)'} : {color:'#999'}]}>
            {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.light.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Pedido #{requestId}</Text>
          <Text style={styles.headerSub}>Chat ao vivo</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
        onContentSizeChange={scrollToBottom}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE', ...Shadows.small },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerSub: { fontSize: 12, color: Colors.light.success },
  
  msgRow: { flexDirection: 'row', marginBottom: 12 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18, ...Shadows.small },
  bubbleMe: { backgroundColor: Colors.light.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
  
  msgText: { fontSize: 16, lineHeight: 22 },
  textMe: { color: '#FFF' },
  textOther: { color: '#333' },
  time: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, fontSize: 16, maxHeight: 100, marginRight: 10 },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.small }
});