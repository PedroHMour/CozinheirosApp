import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView, Platform,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';

// Interfaces para TypeScript
interface Message {
  id?: number;
  request_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;

  // --- ⚠️ SEU IP AQUI ---
  const API_URL = 'http://192.168.100.89:3000'; 
  
  const [socket, setSocket] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null); 

  useEffect(() => {
    if (!requestId) {
      router.back();
      return;
    }

    const init = async () => {
      const u = await AsyncStorage.getItem('user');
      const userData = u ? JSON.parse(u) : null;
      setUser(userData);

      // Carregar histórico
      try {
        const response = await fetch(`${API_URL}/messages/${requestId}`);
        const historicData = await response.json();
        if (Array.isArray(historicData)) setMessages(historicData);
      } catch (e) { console.log(e); }

      // Conectar Socket
      const newSocket = io(API_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('join_room', requestId);
      });

      newSocket.on('receive_message', (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      });
    };

    init();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [requestId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = () => {
    if (newMessage.trim() === '' || !socket || !user) return;

    const msgData: Message = {
      request_id: Number(requestId),
      sender_id: user.id,
      content: newMessage,
      created_at: new Date().toISOString()
    };

    socket.emit('send_message', msgData);
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.msgText, isMe ? styles.textMe : styles.textOther]}>
          {item.content}
        </Text>
        <Text style={styles.time}>
          {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{padding:5}}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Chat do Pedido #{requestId}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 15 }}
        onContentSizeChange={scrollToBottom}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.inputArea}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <TextInput
          style={styles.input}
          placeholder="Digite aqui..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.btnSend} onPress={handleSend}>
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E5E5' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 15, 
    backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#DDD' 
  },
  title: { fontSize: 18, fontWeight: 'bold', marginLeft: 15, color: '#333' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#FF6F00', borderBottomRightRadius: 2 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 16 },
  textMe: { color: '#FFF' },
  textOther: { color: '#333' },
  time: { fontSize: 10, alignSelf: 'flex-end', marginTop: 5, opacity: 0.7 },
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F0F0F0', padding: 12, borderRadius: 25, marginRight: 10 },
  btnSend: { backgroundColor: '#FF6F00', padding: 12, borderRadius: 50, justifyContent:'center', alignItems:'center' },
});