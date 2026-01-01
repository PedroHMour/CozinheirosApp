import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { calculateEarnings } from '../src/constants/packages';
import { Colors, Shadows, Typography } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';

const CHAVE_PIX_PLATAFORMA = "sua_chave_pix_aqui"; 

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 

  const [loading, setLoading] = useState(false);
  const [modalPixVisible, setModalPixVisible] = useState(false);
  
  // Esta variável estava dando aviso de não usada. Agora garantimos o uso abaixo.
  const [selectedMethod, setSelectedMethod] = useState<string>('pix');

  const methods = [
    { id: 'pix', title: 'Pix Copia e Cola', sub: 'Aprovação Imediata' }
  ];

  const totalPrice = parseFloat(params.price as string) || 0;
  const packageId = params.package_id as string;
  const earnings = calculateEarnings(packageId);
  
  const handleCopyPix = async () => {
    await Clipboard.setStringAsync(CHAVE_PIX_PLATAFORMA);
    Alert.alert("Copiado!", "Chave copiada. Vá ao seu banco e pague.");
  };

  const handleConfirmPayment = async () => {
      setLoading(true);
      try {
          const { error } = await supabase
            .from('requests')
            .insert({
                client_id: params.client_id,
                dish_description: params.dish,
                people_count: Number(params.people),
                package_level: params.package_id,
                total_price: totalPrice,          
                cook_profit: earnings.profit,     
                platform_fee: totalPrice - earnings.profit,
                latitude: Number(params.latitude),
                longitude: Number(params.longitude),
                status: 'pending',
                payment_method: 'pix_manual'
            });

          if (error) throw error;

          setModalPixVisible(false);
          Alert.alert("Sucesso! 🎉", "Estamos procurando um chef para você!");
          router.replace('/(tabs)/activity');

      } catch (error: any) {
          console.error(error);
          Alert.alert("Erro", "Falha ao criar o pedido. Tente novamente.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={Typography.header}>Pagamento</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
            <Text style={Typography.subHeader}>Resumo</Text>
            <Text style={Typography.body}>{params.dish} ({params.people} pessoas)</Text>
            <Text style={{color: Colors.light.textSecondary, fontSize: 12}}>
                Pacote: {params.package_id?.toString().toUpperCase()}
            </Text>
        </View>

        <FlatList
          data={methods}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            // CORREÇÃO: Usamos o 'selectedMethod' aqui para comparar
            const isSelected = selectedMethod === item.id; 
            return (
                <TouchableOpacity 
                    style={[styles.card, isSelected && styles.cardSelected]} 
                    onPress={() => setSelectedMethod(item.id)}
                >
                    <Ionicons name="qr-code" size={24} color={isSelected ? "#FFF" : Colors.light.primary} />
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[{fontWeight:'bold'}, isSelected ? {color:'#FFF'} : {color:Colors.light.text}]}>
                            {item.title}
                        </Text>
                        <Text style={[{fontSize:12}, isSelected ? {color:'rgba(255,255,255,0.8)'} : {color:Colors.light.textSecondary}]}>
                            {item.sub}
                        </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#FFF" />}
                </TouchableOpacity>
            );
          }}
        />

        <View style={styles.footer}>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                <Text style={Typography.body}>Total:</Text>
                <Text style={[Typography.subHeader, {color: Colors.light.primary}]}>
                    R$ {totalPrice.toFixed(2)}
                </Text>
            </View>
            <TouchableOpacity style={styles.payBtn} onPress={() => setModalPixVisible(true)}>
                <Text style={Typography.button}>Pagar com Pix</Text>
            </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalPixVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <Text style={[Typography.subHeader, {textAlign:'center', marginBottom:10}]}>Pagamento Pix</Text>
             <Text style={{textAlign:'center', color:'#666', marginBottom:20}}>
                 Transfira o valor exato para a chave abaixo:
             </Text>
             
             <View style={styles.pixBox}>
                 <Text style={{fontWeight:'bold', fontSize:16}} numberOfLines={1}>{CHAVE_PIX_PLATAFORMA}</Text>
                 <TouchableOpacity onPress={handleCopyPix} style={{marginLeft:10}}>
                     <Ionicons name="copy-outline" size={24} color={Colors.light.primary} />
                 </TouchableOpacity>
             </View>

             <Text style={{textAlign:'center', fontSize:24, fontWeight:'bold', color:Colors.light.primary, marginBottom:30}}>
                 R$ {totalPrice.toFixed(2)}
             </Text>

             <TouchableOpacity 
                style={[styles.confirmBtn, loading && {opacity:0.7}]}
                onPress={handleConfirmPayment}
                disabled={loading}
             >
                 {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>JÁ FIZ O PIX</Text>}
             </TouchableOpacity>

             <TouchableOpacity onPress={() => setModalPixVisible(false)} style={{marginTop:15, alignSelf:'center'}}>
                 <Text style={{color:'#999'}}>Cancelar</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: Colors.light.card, ...Shadows.soft },
  backBtn: { marginRight: 15 },
  content: { flex: 1, padding: 20 },
  sectionHeader: { marginBottom: 20, marginTop: 10 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  cardSelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  footer: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: Colors.light.card, padding: 20, borderRadius: 16, ...Shadows.float },
  payBtn: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', padding: 20 },
  modalContent: { backgroundColor: Colors.light.card, padding: 25, borderRadius: 24, ...Shadows.float },
  pixBox: { flexDirection:'row', backgroundColor:'#F5F5F5', padding:15, borderRadius:8, alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  confirmBtn: { backgroundColor: '#2ecc71', padding: 18, borderRadius: 12, alignItems: 'center' },
  confirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});