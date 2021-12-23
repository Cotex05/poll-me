import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native'
import { Button, Icon, Input, Overlay } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import QRCode from "react-qr-code";
import { db, auth } from '../firebase';
import * as firebase from 'firebase';

const PasswordChangeButton = () => {

    // Password handling constants
    const [passChangeView, setPassChangeView] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordAgain, setNewPasswordAgain] = useState("");
    const [newPassColor, setNewPassColor] = useState('white');
    const [passwordChangeButton, setpasswordChangeButton] = useState(true);

    const userProfile = auth.currentUser;

    const handlePasswordClose = () => {
        setPassChangeView(false);
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordAgain("");
        setNewPassColor('white');
    };

    const handleNewPassword = (text) => {
        setNewPassword(text);
        if (newPasswordAgain.length != 0) {
            if (text === newPasswordAgain) {
                setNewPassColor('limegreen');
                setpasswordChangeButton(false);
            } else {
                setNewPassColor('red');
                setpasswordChangeButton(true);
            }
        }
    };

    const handleNewPasswordAgain = (text) => {
        setNewPasswordAgain(text);
        if (text === newPassword && text.length != 0) {
            setNewPassColor('limegreen');
            setpasswordChangeButton(false);
        } else {
            setNewPassColor('red');
            setpasswordChangeButton(true);
        }
    };


    const changePassword = () => {
        const credential = firebase.auth.EmailAuthProvider.credential(
            userProfile.email,
            currentPassword
        );
        if (newPassword.trim().length == 0 || newPasswordAgain.trim().length == 0) {
            ToastAndroid.showWithGravity(
                "Empty Password!",
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
            );
            return;
        }
        if (newPassword.length < 8 || newPasswordAgain.length < 8) {
            Alert.alert("Password too small", "New password must be of 8 or more characters. \nMake sure password is strong enough, and contains mixture of letters, numbers and symbols.");
            return;
        }
        userProfile.reauthenticateWithCredential(credential).then(() => {
            // User re-authenticated.
            if (newPassword === newPasswordAgain) {
                userProfile.updatePassword(newPasswordAgain).then(() => {
                    // Update successful.
                    ToastAndroid.showWithGravity(
                        "Password Changed Successfully!",
                        ToastAndroid.SHORT,
                        ToastAndroid.CENTER
                    );
                }).catch((error) => {
                    // An error ocurred
                    Alert.alert("Error in changing password!", error.message);
                });
            }
        }).catch((error) => {
            // An error happened.
            Alert.alert("Wrong password!", "You have entered the incorrect old password!");
        });
        setPassChangeView(false);
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordAgain("");
        setNewPassColor('white');
    };


    return (
        <View>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setPassChangeView(true)}>
                <View style={styles.options}>
                    <Icon name="security" size={30} type="material-icons" color="white" />
                    <Text style={styles.BtnTxt}>Change Password</Text>
                </View>
            </TouchableOpacity>
            <Overlay overlayStyle={{ backgroundColor: '#000', borderRadius: 20 }} isVisible={passChangeView} onBackdropPress={handlePasswordClose}>
                <View style={{ width: 350, backgroundColor: '#000', borderRadius: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontSize: 20, padding: 12 }}>Change Password</Text>
                        <Icon onPress={handlePasswordClose} containerStyle={{ padding: 12 }} size={30} name="cancel" color="red" />
                    </View>
                    <View>
                        <Input
                            leftIcon={
                                <Icon
                                    name='lock'
                                    size={24}
                                    color='#fff'
                                />}
                            placeholder="Current password"
                            autoCorrect={false}
                            secureTextEntry
                            type="password"
                            value={currentPassword}
                            onChangeText={text => setCurrentPassword(text)}
                            maxLength={30}
                            inputStyle={{ color: '#fff' }}
                            autoFocus={true}
                        />
                        <Input
                            leftIcon={
                                <Icon
                                    name='lock'
                                    size={24}
                                    color={newPassColor}
                                />}
                            placeholder="Type new password"
                            autoCorrect={false}
                            secureTextEntry
                            type="password"
                            value={newPassword}
                            onChangeText={text => handleNewPassword(text)}
                            maxLength={30}
                            inputStyle={{ color: '#fff' }}
                        />
                        <Input
                            leftIcon={
                                <Icon
                                    name='lock'
                                    size={24}
                                    color={newPassColor}
                                />}
                            placeholder="Retype new password"
                            autoCorrect={false}
                            secureTextEntry
                            type="password"
                            value={newPasswordAgain}
                            onChangeText={text => handleNewPasswordAgain(text)}
                            maxLength={30}
                            inputStyle={{ color: '#fff' }}
                        />
                    </View>
                    <Button
                        title="Confirm Change"
                        containerStyle={{ width: 200, alignSelf: 'center', paddingVertical: 12 }}
                        onPress={changePassword}
                        disabled={passwordChangeButton}
                    />
                </View>
            </Overlay>
        </View>
    )
}

const QrButton = () => {

    const [qrView, setQrView] = useState(false);
    const [userData, setUserData] = useState([]);

    const qrClose = () => {
        setQrView(false);
    };

    useEffect(() => {
        const unsubscribe = db.collection('user').doc(auth.currentUser.email).get().then((doc) => {
            setUserData(doc.data());
        })
        return () => {
            unsubscribe;
        }
    }, []);

    return (
        <View>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setQrView(true)}>
                <View style={styles.options}>
                    <Icon name="qrcode" size={30} type="ant-design" color="white" />
                    <Text style={styles.BtnTxt}>QR Code</Text>
                </View>
            </TouchableOpacity>
            <Overlay overlayStyle={{ backgroundColor: '#000', borderRadius: 20 }} isVisible={qrView} onBackdropPress={qrClose}>
                <View style={{ width: 350, backgroundColor: '#000', borderRadius: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontSize: 20, padding: 12 }}>QR Code</Text>
                        <Icon onPress={qrClose} containerStyle={{ padding: 12 }} size={30} name="cancel" color="red" />
                    </View>
                    <Animatable.View animation="zoomIn" easing="ease-in-expo" style={styles.qr}>
                        <QRCode value={userData?.handle} size={256} level="M" />
                    </Animatable.View>
                </View>
            </Overlay>
        </View>
    )
}

const SettingScreen = ({ navigation }) => {

    const signOutUser = () => {
        auth.signOut().then(() => {
            navigation.navigate('Main');
            setTimeout(() => {
                navigation.replace('Login');
            }, 500);
        });
    }

    return (
        <View style={styles.main}>
            <View>
                <View style={styles.ButtonContainer}>
                    <QrButton />
                    <PasswordChangeButton />
                    <TouchableOpacity activeOpacity={0.8} onPress={signOutUser}>
                        <View style={styles.options}>
                            <Icon name="logout" size={30} type="ionicons" color="white" />
                            <Text style={[styles.BtnTxt, { color: 'red' }]}>LogOut</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

export default SettingScreen;

const styles = StyleSheet.create({
    main: {
        backgroundColor: '#123',
        flex: 1
    },
    ButtonContainer: {
        margin: 10
    },
    options: {
        borderColor: 'gray',
        borderBottomWidth: 0.5,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginHorizontal: 15
    },
    BtnTxt: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 12,
        color: '#fff'
    },
    qr: {
        justifyContent: 'center',
        borderColor: 'gray',
        padding: 10,
        alignSelf: 'center',
        borderWidth: 1,
        margin: 10
    }
})
