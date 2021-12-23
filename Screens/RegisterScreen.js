import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, KeyboardAvoidingView, Alert, ImageBackground } from 'react-native';
import { Button, Input, Image, Icon } from 'react-native-elements';
import { auth, db } from '../firebase';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isError, setIsError] = useState(false);

    const userDetail = {
        handle: username.toLocaleLowerCase(),
        about: "Hi Everyone!",
        postsCount: 0,
        followersCount: 0,
        followingsCount: 0,
        followers: [],
        followings: []
    }

    const register = () => {
        db.collection("user").where("handle", "==", username.toLocaleLowerCase()).get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if (doc.exists) {
                    setIsError(true);
                    return;
                }
            });
        });
        if (name.trim().length === 0 || name.length < 5) {
            Alert.alert("Full Name Required!", "Please enter your full name.");
            return;
        }
        else if (email.trim().length === 0) {
            Alert.alert("Please enter email", "Please enter a valid email address.");
            return;
        } else if (password.trim().length === 0) {
            Alert.alert("Please enter password", "Please enter a strong password, it will be register with your email address.");
            return;
        }
        auth.createUserWithEmailAndPassword(email, password)
            .then((authUser) => {
                authUser.user.updateProfile({
                    displayName: name,
                    photoURL: "https://i.imgur.com/qlBdn0Q.png",
                });
                db.collection("user").doc(email).set({
                    username: name,
                    ownerEmail: email.toLocaleLowerCase(),
                    ownerUid: auth?.currentUser?.uid,
                    handle: username.toLocaleLowerCase(),
                    profileImage: "https://i.imgur.com/qlBdn0Q.png",
                }).then(() => {
                    console.log("[+] New User Joined!");
                });
            })
            .catch(error => Alert.alert("Sign-up error!", error.message));
        setTimeout(() => {
            db.collection("userDetails").doc(email).set(userDetail).then(() => {
                console.log("\n Details of User added successfully! \n");
            })
        }, 3000);
    }

    useEffect(() => {
        setIsError(false);
    }, [username])

    const handleUsername = (username) => {
        setUsername(username.replace(/[^a-zA-Z0-9_]/g, ''));
    }

    return (
        <ImageBackground source={require("../assets/images/loginBg.png")} resizeMode="cover" style={styles.container}>
            <KeyboardAvoidingView behavior='height' keyboardVerticalOffset={50} style={styles.innnerContainer}>
                <StatusBar style="light" />
                <Image source={require('../assets/icon.png')}
                    style={{ width: 100, height: 100, margin: 15 }}
                />
                <Text style={{ margin: 20, fontSize: 25, fontWeight: 'bold', color: '#007fff' }}>
                    Create New Account
                </Text>
                <View style={styles.inputContainer}>
                    <Input
                        placeholder="Enter your Full Name"
                        autoCorrect={false}
                        type="text"
                        value={name}
                        onChangeText={text => setName(text)}
                        maxLength={25}
                        inputStyle={{ color: '#eef' }}
                        autoComplete="off"
                    />
                    <Input
                        placeholder="Username"
                        autoCorrect={false}
                        type="username"
                        value={username}
                        onChangeText={username => handleUsername(username)}
                        maxLength={25}
                        inputStyle={{ color: '#eef' }}
                        errorMessage={isError == true ? ("username already taken!") : ("")}
                        leftIcon={
                            <Icon
                                name='at'
                                type="font-awesome"
                                size={20}
                                color='#007fff'
                            />
                        }
                    />
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
                <Button raised containerStyle={styles.button} onPress={register} title="Register" />
            </KeyboardAvoidingView>
        </ImageBackground>
    )
}

export default RegisterScreen;

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
        padding: 10,
    },
    button: {
        width: 200,
        marginTop: 10
    }
})
