import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../ui/theme';
export default function GlassPanel({children,style}: {children:React.ReactNode;style?:StyleProp<ViewStyle>}) {
  const {colors}=useTheme();
  return <LinearGradient colors={colors.dark?['#777875','#41423f','#282a27']:['#ffffff','#cacac4','#999c94']} start={{x:0,y:0}} end={{x:0.8,y:1}} style={[{borderRadius:25,padding:1.2,shadowColor:'#000',shadowOffset:{width:0,height:7},shadowOpacity:0.28,shadowRadius:10,elevation:5},style]}><LinearGradient colors={colors.dark?['#30312e','#242522','#1d1e1c']:['#ffffff','#f1f0eb','#e4e5dd']} start={{x:0,y:0}} end={{x:0.7,y:1}} style={{borderRadius:24,padding:17,overflow:'hidden',borderTopWidth:1,borderTopColor:colors.dark?'#ffffff12':'#ffffff'}}><View pointerEvents="none" style={{position:'absolute',top:-90,left:-40,width:180,height:320,backgroundColor:'#ffffff03',transform:[{rotate:'-35deg'}]}} />{children}</LinearGradient></LinearGradient>;
}
