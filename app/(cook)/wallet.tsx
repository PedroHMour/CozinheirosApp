import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';

export default function WalletScreen() {
  const { user } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  
  const [pixKey, setPixKey] = useState(user?.pix_key || '');
  const [requesting, setRequesting] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (!user?.id) return;
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('wallet_balance, pix_key')
            .eq('id', user.id)
            .single();

        if (userData) {
            setBalance(userData.wallet_balance || 0);
            setPixKey((prev: string) => prev || userData.pix_key || '');
        }

        const { data: withdraws } = await supabase
            .from('withdraws')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (withdraws) setWithdrawHistory(withdraws);

    } catch (e) {
        console.log("Erro ao carregar carteira", e);
    }
  }, [user]);

  React.useEffect(() => {
      fetchWalletData();
  }, [fetchWalletData]);

  const onRefresh = () => {
      setRefreshing(true);
      fetchWalletData().finally(() => setRefreshing(false));
  };

  const handleRequestWithdraw = async () => {
      if (balance <= 0) return Alert.alert("Saldo Zerado", "Você não tem valores para sacar.");
      if (!pixKey) return Alert.alert("Falta a Chave", "Informe sua Chave Pix para receber.");

      setRequesting(true);
      try {
          const { error: wError } = await supabase
            .from('withdraws')
            .insert({
                user_id: user?.id,
                amount: balance,
                pix_key: pixKey,
                status: 'pending'
            });

          if (wError) throw wError;

          const { error: uError } = await supabase
            .from('users')
            .update({ wallet_balance: 0, pix_key: pixKey }) 
            .eq('id', user?.id);

          if (uError) throw uError;

          Alert.alert("Solicitado!", "O pagamento será enviado para sua conta em breve.");
          onRefresh();
          setBalance(0); 

      } catch {
          // CORREÇÃO: Removido (error)
          Alert.alert("Erro", "Não foi possível solicitar o saque.");
      } finally {
          setRequesting(false);
      }
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
      <View style={styles.historyItem}>
          <View>
              <Text style={styles.historyType}>Saque Pix</Text>
              <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.historyAmount}>- R$ {Number(item.amount).toFixed(2)}</Text>
              <Text style={[styles.historyStatus, {color: item.status === 'paid' ? 'green' : '#F57F17'}]}>
                  {item.status === 'paid' ? 'Pago' : 'Pendente'}
              </Text>
          </View>
      </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={{padding: 20}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
          <Text style={styles.headerTitle}>Financeiro</Text>

          <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Saldo Disponível</Text>
              <Text style={styles.balanceValue}>R$ {balance.toFixed(2)}</Text>
              <Text style={styles.balanceSub}>Já descontada a taxa da plataforma (11%)</Text>
          </View>

          <View style={styles.withdrawSection}>
              <Text style={styles.sectionTitle}>Solicitar Saque</Text>
              
              <Text style={styles.inputLabel}>Sua Chave Pix</Text>
              <TextInput 
                  style={styles.input}
                  placeholder="CPF, Email ou Telefone"
                  value={pixKey}
                  onChangeText={setPixKey}
              />

              <TouchableOpacity 
                style={[styles.withdrawBtn, (balance <= 0 || requesting) && {opacity: 0.5}]}
                onPress={handleRequestWithdraw}
                disabled={balance <= 0 || requesting}
              >
                  {requesting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.withdrawBtnText}>RECEBER TUDO AGORA</Text>}
              </TouchableOpacity>
              {balance <= 0 && <Text style={styles.emptyMsg}>Você precisa realizar entregas para ter saldo.</Text>}
          </View>

          <Text style={[styles.sectionTitle, {marginTop: 30}]}>Histórico</Text>
          {withdrawHistory.length === 0 ? (
              <Text style={styles.emptyHistory}>Nenhum saque realizado ainda.</Text>
          ) : (
              <FlatList 
                data={withdrawHistory}
                renderItem={renderHistoryItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
          )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.light.text, marginBottom: 20 },
  balanceCard: {
      backgroundColor: Colors.light.primary, padding: 25, borderRadius: 20,
      alignItems: 'center', marginBottom: 25, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 5 },
  balanceValue: { color: '#FFF', fontSize: 42, fontWeight: 'bold' },
  balanceSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: 15 },
  withdrawSection: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#EEE' },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#EEE', fontSize: 16, marginBottom: 15 },
  withdrawBtn: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 12, alignItems: 'center' },
  withdrawBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  emptyMsg: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 10 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  historyType: { fontWeight: '600', color: '#333' },
  historyDate: { fontSize: 12, color: '#999' },
  historyAmount: { fontWeight: 'bold', color: '#e74c3c' },
  historyStatus: { fontSize: 12, fontWeight: '600' },
  emptyHistory: { textAlign: 'center', color: '#CCC', marginTop: 20 }
});