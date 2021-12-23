import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, KeyboardAvoidingView, Alert, ToastAndroid, Keyboard, ImageBackground, TouchableWithoutFeedback, SafeAreaView } from 'react-native';
import { Button, Input, Image, Icon } from 'react-native-elements';
import { auth } from '../firebase';

const LoginScreen = ({ navigation }) => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (authUser) {
                navigation.replace("Main");
            }
        });
        return unsubscribe;
    }, [])

    const signIn = () => {
        if (email.trim().length === 0) {
            Alert.alert("Please enter email", "Please enter your registered email address.");
            return;
        } else if (password.trim().length === 0) {
            Alert.alert("Please enter password", "Please enter your password, registered with your email address.");
            return;
        }
        auth.fetchSignInMethodsForEmail(email.toLocaleLowerCase())
            .then(providers => {
                if (providers.length === 0) {
                    // this email hasn't signed up yet
                    Alert.alert("Not Found", "Your email address is not yet registered here. Please register an account first.",
                        [
                            {
                                text: "Cancel",
                                onPress: () => console.log("Cancel Pressed"),
                            },
                            { text: "Register Now", onPress: () => navigation.navigate("Register") }
                        ]
                    )
                } else {
                    // has signed up
                    auth.signInWithEmailAndPassword(email.toLocaleLowerCase(), password)
                        .then((userCredential) => {
                            // Signed in
                            const user = userCredential.user;
                            // console.log("Successfully Signed-in!", user);
                            ToastAndroid.showWithGravity(
                                `Welcome Back, ${user.displayName}`,
                                ToastAndroid.SHORT,
                                ToastAndroid.CENTER
                            );
                        })
                        .catch((error) => {
                            // Error
                            Alert.alert("Login Error!", error.message)
                        });
                }
            })
            .catch(error => Alert.alert("Login Error!", error.message));

        setEmail("");
        setPassword("");
        Keyboard.dismiss();
    }

    return (
        <ImageBackground source={require("../assets/images/loginBg.png")} resizeMode="cover" style={styles.container}>
            <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={20} style={styles.innnerContainer}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <>
                        <StatusBar style="light" />
                        <Image source={require('../assets/icon.png')}
                            style={{ width: 150, height: 150, margin: 15 }}
                        />
                        <View style={styles.inputContainer}>
                            <Input
                                placeholder="Email"
                                autoCorrect={false}
                                autoComplete="off"
                                keyboardType="email-address"
                                type="email"
                                value={email}
                                onChangeText={text => setEmail(text)}
                                maxLength={50}
                                inputStyle={{ color: '#eef' }}
                                leftIcon={
                                    <Icon
                                        name='email'
                                        size={24}
                                        color='ghostwhite'
                                    />
                                }
                            />
                            <Input
                                placeholder="Password"
                                autoCorrect={false}
                                secureTextEntry
                                type="password"
                                value={password}
                                onChangeText={text => setPassword(text)}
                                onSubmitEditing={signIn}
                                maxLength={30}
                                inputStyle={{ color: '#eef' }}
                                leftIcon={
                                    <Icon
                                        name='lock'
                                        size={24}
                                        color='limegreen'
                                    />
                                }
                            />
                        </View>
                        <Button raised containerStyle={styles.button} onPress={signIn} title="Login" />
                        <Button raised onPress={() => navigation.navigate("Register")} containerStyle={styles.button} type="outline" title="Register" />
                    </>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </ImageBackground>
    )
}

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center'
    },
    innnerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    inputContainer: {
        width: 300,
        backgroundColor: 'rgba(0,100,255,0.3)',
        borderRadius: 20,
        padding: 10
    },
    button: {
        width: 200,
        marginTop: 10
    },
})

