import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, Alert, Keyboard, ToastAndroid, TouchableHighlight, ActivityIndicator } from 'react-native'
import { Avatar, Button, Icon, Input, ListItem, Overlay } from 'react-native-elements';
import { auth, db } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';

const SearchScreen = ({ navigation }) => {

    const textInputRef = React.useRef();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [disp, setDisp] = useState('none');
    const [userInfo, setUserInfo] = useState([]);
    const [scannerVisible, setScannerVisible] = useState(false);

    const [scanned, setScanned] = useState(false);
    const [searcher, setSearcher] = useState(false);

    var fetchResults;
    var userData;

    const handleBarCodeScanned = async ({ type, data }) => {
        setScanned(true);
        setQuery(data);
        setTimeout(() => {
            setScannerVisible(false);
            setSearcher(true);
        }, 200);
    };

    useEffect(() => {
        if (searcher == true) {
            handleSearch();
            setSearcher(false);
        }
    }, [searcher]);

    const askForPermission = async () => {
        const cameraPermissionResult = await Camera.requestPermissionsAsync();
        const imageLibraryPermissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraPermissionResult.granted === false || imageLibraryPermissionResult.granted === false) {
            Alert.alert('Need Permissions!',
                "Please allow the app, to access Camera and Storage.",
                [
                    {
                        text: "Cancel",
                        onPress: () => console.log("Cancel Pressed"),
                    },
                    { text: "Ok", onPress: () => askForPermission() }
                ])
            return false;
        }
        return true;
    };

    const handleScanner = async () => {
        const hasPermission = await askForPermission();
        if (!hasPermission) {
            return;
        } else {
            setScannerVisible(true);
        }
    }

    useEffect(() => {

        navigation.setOptions({
            headerRight: () => (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginHorizontal: 10
                }}>
                    <TouchableOpacity onPress={handleScanner} style={{ marginHorizontal: 5 }}>
                        <Icon name="qrcode-scan" type="material-community" size={30} color="#fff" />
                    </TouchableOpacity>
                </View>
            )
        })
        const unsubscribe = navigation.addListener("focus", (e) => {
            textInputRef.current.focus();
        });
        return (() => {
            unsubscribe;
        })
    }, [navigation]);

    const viewProfile = () => {
        if (auth.currentUser.uid == userInfo.ownerUid) {
            navigation.navigate("Profile");
        } else {
            navigation.navigate("UserProfile", { data: userInfo });
        }
    }

    const handleSearch = async () => {
        setLoading(true);
        setDisp('none');
        Keyboard.dismiss();
        const results = await db.collection("user").where("handle", "==", query.toLocaleLowerCase()).get();
        if (!results.empty) {
            results.forEach(profile => {
                if (profile.data().handle == query.toLocaleLowerCase()) {
                    fetchResults = profile.data();
                }
            });
        } else {
            ToastAndroid.showWithGravity(
                "No user found!",
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
            );
            setLoading(false);
            return;
        }
        db.collection("user").doc(fetchResults.ownerEmail).get().then((doc) => {
            userData = doc.data();
            setResults(fetchResults);
        })
        setTimeout(() => {
            setLoading(false);
            setDisp('flex');
            setUserInfo(userData);
        }, 2000);
    }

    return (
        <View style={styles.main}>
            <View>
                <View style={{ padding: 10 }}>
                    <Input
                        ref={textInputRef}
                        placeholder='Search by username...'
                        rightIcon={<Icon onPress={handleSearch} name="search" color="#eef" size={25} />}
                        leftIcon={<Icon name="at" type="font-awesome" size={22} color="#007fff" containerStyle={{ backgroundColor: "rgba(255,255,255,0.1)", padding: 9, marginRight: -9, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} />}
                        inputStyle={{ color: '#eef', fontFamily: 'serif', backgroundColor: 'rgba(255,255,255,0.1)', padding: 5, borderBottomRightRadius: 12, borderTopRightRadius: 12 }}
                        multiline={true}
                        value={query}
                        maxLength={50}
                        onChangeText={query => setQuery(query)}
                        style={{ margin: 5 }}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        returnKeyLabel="search"
                        blurOnSubmit
                    />
                </View>
                <ActivityIndicator style={{ display: loading ? 'flex' : 'none' }} size="large" color="#007fff" />
                <ListItem
                    bottomDivider
                    Component={TouchableHighlight}
                    containerStyle={{ backgroundColor: 'rgba(0,0,0,0.3)', display: disp }}
                    disabledStyle={{ opacity: 0.5 }}
                    pad={20}
                    topDivider
                >
                    <Avatar
                        rounded
                        size={40}
                        source={{
                            uri: results?.profileImage
                        }}
                    />
                    <ListItem.Content>
                        <ListItem.Title>
                            <Text style={{ color: "#eef", fontWeight: "bold" }}>{results?.username}</Text>
                        </ListItem.Title>
                        <ListItem.Subtitle>
                            <Text style={{ color: "limegreen", fontFamily: 'monospace' }}>{results?.handle}</Text>
                        </ListItem.Subtitle>
                    </ListItem.Content>
                    <Button onPress={viewProfile} title="View Profile" type="outline" />
                </ListItem>
                <Overlay overlayStyle={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 20 }} isVisible={scannerVisible} onBackdropPress={() => setScannerVisible(false)}>
                    <View>
                        <View style={styles.barcodebox}>
                            <BarCodeScanner
                                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                                style={{ height: 500, width: 500 }}
                            />
                        </View>
                    </View>
                    {scanned && <Button buttonStyle={{ margin: 15 }} title='Scan Again' onPress={() => setScanned(false)} />}
                </Overlay>
            </View>
        </View>
    )
}

export default SearchScreen;

const styles = StyleSheet.create({
    main: {
        backgroundColor: '#123',
        flex: 1
    },
    barcodebox: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        width: 300,
        overflow: 'hidden',
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.5)'
    }
})
