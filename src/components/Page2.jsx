import React, {
  useState,
  useEffect,
  Fragment,
  useRef,
  cloneElement,
} from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { IoSettingsOutline } from "react-icons/io5";
import { FiRefreshCcw } from "react-icons/fi";
import { styled } from "@mui/material/styles";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import axios from "axios";
import io from "socket.io-client";
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Grid,
} from "@mui/material";
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { IconButton } from '@mui/material';
import { InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import useLocalStoragePath from 'use-local-storage-state';
import moment from 'moment';

const apiClient = axios.create({
  withCredentials: false,
  timeout: 10000,
});
const Home = () => {
  const [user, setUser] = useLocalStoragePath('user',{defaultValue:null});
  const [Scales4Kg, setScales4Kg] = useState({});
  const [Scales50Kg, setScales50Kg] = useState({});
  const [continueState, setContinueState] = useState(false);
  const [isFinalStep, setFinalStep] = useLocalStoragePath("isFinalStep", { defaultValue: false });
  const [scanData, setScanData] = useState("");
  const [binOffline, setBinOffline] = useState(false);
  const [container, setContainer] = useLocalStoragePath('container',{defaultValue:null});
  const [isOnline, setIsOnline] = useState(false);
  const [waste, setWaste] = useLocalStoragePath("waste", { defaultValue: null });
  const [wastename, setWastename] = useLocalStoragePath("wastename", { defaultValue: "" });
  const [Idbin, setIdbin] = useLocalStoragePath("Idbin", { defaultValue: -1 });
  const [binname, setBinname] = useLocalStoragePath("binname", { defaultValue: "" });
  const [containerName, setContainerName] = useState("");
  const [isFreeze, freezeNeto] = useLocalStoragePath("isFreeze", { defaultValue: false });
  const [refreshModal, setRefreshModal] = useState(false);
  const [refreshBinModal, setRefreshBinModal] = useState(false);
  const [isSubmitAllowed, setIsSubmitAllowed] = useLocalStoragePath("isSubmitAllowed", { defaultValue: false });
  const [showModal, setShowModal] = useState(false);
  const [showContinueModal, toggleContinueModal] = useState(false);
  const [showModalDispose, setShowModalDispose] = useState(false);
  const [allowContinueModal, setAllowContinueModal] = useState(false);
  const [showModalInfoScale, setShowModalInfoScales] = useState(false);
  const [showErrorDispose, setShowErrorDispose] = useState(false);
  const [showBinProblemMessage,setShowBinProblemMessage] = useState(false);
  const [binProblem,setBinProblem] = useState({continue: false});
  const [errDisposeMessage, setErrDisposeMessage] = useState("");
  const [finalneto, setFinalNeto] = useState(0);
  const [neto, setNeto] = useLocalStoragePath("neto", { defaultValue: {} });
  const [neto50Kg, setNeto50kg] = useLocalStoragePath("neto50Kg", { defaultValue: 0 });
  const [neto4Kg, setNeto4kg] = useLocalStoragePath("neto4Kg", { defaultValue: 0 });
  const [toplockId, settoplockId] = useLocalStoragePath("toplockId", { defaultValue: { hostname: "" } });
  const [instruksimsg, setinstruksimsg] = useLocalStoragePath("instruksimsg", { defaultValue: "" });
  const [message, setmessage] = useLocalStoragePath("message", { defaultValue: "" });
  const [type, setType] = useLocalStoragePath("type", { defaultValue: "" });
  const [typecollection, setTypeCollection] = useLocalStoragePath("typecollection", { defaultValue: "" });
  const [weightbin, setWeightbin] = useLocalStoragePath("weightbin", { defaultValue: "" });
  const [binDispose, setBinDispose] = useLocalStoragePath("binDispose", { defaultValue: null });
  const [allowReload,setAllowReload] = useLocalStoragePath('allowReload',{defaultValue:true});
  const inputRef = useRef(null);
  const btnSubmitRef = useRef(null);
  const [bottomLockHostData, setBottomLockData] = useState({
    binId: "",
    hostname: "",
  });
  const [syncing, setSyncing] = useState(false);
  const [socket, setSocket] = useState(); // Sesuaikan dengan alamat server
  const [rackTarget, setRackTarget] = useState(process.env.REACT_APP_RACK);
  const [apiTarget, setApiTarget] = useState(process.env.REACT_APP_PIDSG);
  const [transactionData, setTransactionData] = useLocalStoragePath("transactionData", { defaultValue: {} });
  const [logindate, setLoginDate] = useLocalStoragePath("logindate", { defaultValue: [] });
  const [containers, setContainers] = useLocalStoragePath("containers", { defaultValue: [] });
  const [checkInputInverval, setCheckInputInterval] = useState(null);
  const [ipAddress, setIpAddress] = useState(process.env.REACT_APP_PIDSG);
  const navigation = [{ name: "Dashboard", href: "#", current: true }];
  const [serverErr, setServerErr] = useState({ show: false, message: "" });
  const [serverActive, setServerActive] = useState(true);
  const [rackActive, setRackActive] = useState(true);
  const [restartModal, setRestartModal] = useState({showModal:false,passwordInput:'',showPassword:false})

    useEffect(()=>{
      if (!serverErr.show && !serverActive )
      {
          setServerErr({show:true,message:"Server Disconnecting, Halting Application"});
          setTimeout(() => {
            setServerErr({show:false,message:''});
          }, 1000);
      }
      else if (serverErr.show && serverActive && rackActive )
          setServerErr({show:false,message:''});
  },[serverActive])
  useEffect(()=>{
    if (!rackActive)
    {    
      RefreshNetwork();
      setServerErr({show:true,message: "Rack Disconnected, please try again"});
    }
  },[rackActive])
  const checkAPI = async (url)=>{
      try
      {
          const res = await apiClient.get(`http://${url}/ping`,{timeout:5000});
          return res.status==200;
      }
      catch{
          return false;
      }
  }
  // useEffect(()=>{
  //     const f = async()=>{
  //         const r = await checkAPI('localhost:5000');
  //         setServerActive(r);    
  //         setTimeout(async ()=>{await f()},1000);
  //     }
  //     setTimeout(()=>f(),1);
  // },[])
  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }
  
  const BorderLinearProgress = styled(LinearProgress)(({ theme, value }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor:
        theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor:
        value > 70
          ? "#f44336"
          : theme.palette.mode === "light"
          ? "#1a90ff"
          : "#308fe8",
    },
  }));

  const CustomLinearProgress = ({ value }) => {
    return (
      <LinearProgress
        variant="determinate"
        value={value}
        color={value > 70 ? "error" : "primary"}
        style={{
          width: "90%",
          height: 10,
          borderRadius: 5,
          marginRight: "10px",
        }}
      />
    );
  };
  /*useEffect(() => {
    const getIp = async () => {
      try {
        const ip = await apiClient.get(`http://localhost:5000/ip`);
        setIpAddress(ip.data[0]);
      } catch {
        getIp();
      }
    };
    getIp();
  }, []);*/
  useEffect(() => {
    const getStatus = async () => {
      try {
        const res = await apiClient.get(`http://${ipAddress}`);
        setIsOnline(res.status >= 200 && res.status < 300);
      } catch (er) {
        setIsOnline(false);
      }
    };
    setInterval(() => getStatus(), 5000);
  }, []);
  const getTotalWeight = () => containers.reduce((a, b) => a + b.dataWeight, 0);
  /*const getRackLastTransaction = async (containerName)=>{
        const res  = await apiClient.get(`http://${rackTarget}/Transaksi/${containerName}`);
        const weight = res.data.weight;
        const weightlist = {...lastRackWeight};
        if (!weightlist[containerName])
            weightlist[containerName].weight = 0;
        if (weight ==0 )
            weightlist[containerName].weight = 0;
        else
            weightlist[containerName].weight = parseFloat(weightlist[containerName].weight)+ parseFloat(weight);
        setLastRackWeight({...weightlist});
        return weightlist;
    }*/
  const sendLockBottom = async (_bin) => {
    try {
      const response = await apiClient.post(
        `http://${_bin.name_hostname}.local:5000/lockBottom`,
        {
          idLockBottom: 1,
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {}
  };
  const formatDate = (date) => {
    let d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  };

  const sendDataPanasonicServer = async (
    stationName,
    frombinname,
    tobinname,
    weight,
    type
  ) => {
    //        const _finalNeto = getWeight();
    try {
      await sendWeight(frombinname, weight);
      if (!isOnline) return false;
      const response = await apiClient.post(
        `http://${apiTarget}/api/pid/pidatalog`,
        {
          badgeno: user.badgeId,
          logindate: "",
          stationname: stationName,
          frombinname: frombinname,
          tobinname: tobinname,
          weight: weight,
          activity: type,
        }
      );
      console.log({ pidsg_res: response });
      if (response.status != 200) {
        return false;
      }
      return (
        response.data.status == "Success" || response.data.result == "Success"
      );
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  useEffect(() => {
    let targetHostName = "";
    if (binDispose && binDispose.name_hostname)
      targetHostName = binDispose.name_hostname;
    else if (bottomLockHostData && bottomLockHostData.hostname)
      targetHostName = bottomLockHostData.hostname;
    console.log([targetHostName, binDispose, bottomLockHostData]);
    if (
      targetHostName == "" ||
      targetHostName == null ||
      targetHostName == undefined
    )
      return;
    sendPesanTimbangan(targetHostName, instruksimsg);
  }, [instruksimsg]);

  const sendGreenlampOn = async () => {
    try {
      const response = await apiClient.post(
        `http://${toplockId}.local:5000/greenlampon`,
        {
          idLampGreen: 1,
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendGreenlampOnCollection = async (_bin) => {
    try {
      const response = await apiClient.post(
        `http://${_bin.name_hostname}.local:5000/greenlampon`,
        {
          idLampGreen: 1,
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendGreenlampOff = async (targetName) => {
    try {
      const response = await apiClient.post(
        `http://${targetName}.local:5000/greenlampoff`,
        {
          idLampGreen: 1,
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendYellowOff = async () => {
    try {
      const response = await apiClient.post(
        `http://${toplockId}.local:5000/yellowlampoff`,
        {
          idLampYellow: 1,
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendYellowOffCollection = async (_bin) => {
    try {
      const response = await apiClient.post(
        `http://${_bin.name_hostname}.local:5000/yellowlampoff`,
        {
          idLampYellow: 1,
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendYellowOn = async (targetName) => {
    try {
      const response = await apiClient.post(
        `http://${targetName}.local:5000/yellowlampon`,
        {
          idLampYellow: 1,
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendPesanTimbangan = async (target, instruksi) => {
    try {
      const response = await apiClient.post(
        "http://" + target + ".local:5000/instruksi",
        {
          instruksi: instruksi,
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const sendType = async (target, type) => {
    try {
      const response = await apiClient.post(
        "http://" + target + ".local:5000/type",
        {
          type: type,
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const readSensorTop = async (targetName) => {
    try {
      const response = await apiClient.post(
        `http://${targetName}.local:5000/sensortop`,
        {
          SensorTopId: 1,
        },
        {
          timeout: 6000,
        }
      );
      if (response.status !== 200) {
        return;
      }

      const sensorData = response.data.sensorTop; // Ambil data sensor dari respons

      // Konversi nilai sensor menjadi bentuk boolean
      return sensorData == 1;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  };

  const UpdateBinWeightCollection = async () => {
    try {
      const response = await apiClient.post(
        `http://${process.env.REACT_APP_TIMBANGAN}/UpdateBinWeightCollection`,
        {
          binId: bottomLockHostData.binId,
        },
        {
          timeout: 6000,
        }
      );
      return response.data?.step3 ?? false;
    } catch (error) {
      return false;
    }
  };
  const UpdateBinWeightCollectionManual = async (id) => {
    try {
      const response = await apiClient.post(
        `http://${process.env.REACT_APP_TIMBANGAN}/UpdateBinWeightCollection`,
        {
          binId: id,
        },
        {
          timeout: 6000,
        }
      );
      return response.data?.step3 ?? false;
    } catch (error) {
      return false;
    }
  };
  useEffect(() => {
    if (inputRef && inputRef.current) inputRef.current.focus();
    setSocket(
      io(`http://${process.env.REACT_APP_TIMBANGAN}/`, {
        reconnection: true,
        autoConnect: true,
      })
    );
  }, []);
  useEffect(() => {
    if (!socket) return;
    socket.emit("connectScale");
    socket.on("connect", () => {
      // setIsOnline(true);
    });
    socket.on("disconnect", () => {
      //setIsOnline(false);
    });
    socket.on("data1", (weight50Kg) => {
      try {
        const weight50KgValue =
          weight50Kg && weight50Kg.weight50Kg
            ? parseFloat(weight50Kg.weight50Kg.replace("=", "") ?? "0")
            : 0;
        setScales50Kg({ weight50Kg: weight50KgValue });
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("data", (data) => {
      const weight4KgInKg = parseFloat(data?.weight ?? 0) / 1000;
      setScales4Kg({ weight4Kg: weight4KgInKg });
    });
  }, [socket]);

  useEffect(() => {
    const binWeight = container?.weightbin ?? 0;
    let finalWeight = 0;

    if (Scales50Kg?.weight50Kg) {
      finalWeight = parseFloat(Scales50Kg.weight50Kg) - parseFloat(binWeight);
    }
    if (isFreeze) return;
    setNeto50kg(finalWeight);
  }, [Scales50Kg, , container?.weightbin]);

  useEffect(() => {
    let finalWeight = 0;
    const binWeight = container?.weightbin ?? 0;
    if (Scales4Kg?.weight4Kg) {
      finalWeight = parseFloat(Scales4Kg.weight4Kg) - (parseFloat(binWeight));
    }
    if (isFreeze) return;
    setNeto4kg(finalWeight);
  }, [Scales4Kg, container?.weightbin]);
  const submitEvent = ()=>{
    if (waste.scales == null || waste.scales == undefined || (waste.scales == "4Kg" &&  (neto4Kg <= 0 || Scales4Kg?.weight4Kg <= 0 ) ) || (waste.scales == "50Kg" && (neto50Kg <= 0 || Scales50Kg.weight50Kg <= 0)) )
    {
      if ((waste.scales == "4Kg" &&  (neto4Kg == 0 || Scales4Kg?.weight4Kg == 0 ) ) || (waste.scales == "50Kg" && (neto50Kg == 0 || Scales50Kg.weight50Kg == 0)) )
      {
        setErrDisposeMessage("Berat tidak boleh 0 Cek kembali timbangan");
      }
      else if ((waste.scales == "4Kg" &&  (neto4Kg < 0 || Scales4Kg?.weight4Kg < 0 ) ) || (waste.scales == "50Kg" && (neto50Kg < 0 || Scales50Kg.weight50Kg < 0)) ) 
      {
        setErrDisposeMessage("Berat Tidak Valid/minus");
      }
    }
    else
      toggleModal();
  }
  const toggleModal = () => {
    freezeNeto(true);
    setShowModal(!showModal);
  };

  const toggleModalDispose = () => {
    //freezeNeto(true);
    setShowModalDispose(!showModalDispose);
  };
  const checkProcessRunning = async () => {

    if (!binDispose) return true;
    return await GetBinStatus(binDispose.name_hostname);
  };
  const GetBinStatus = async (binName)=>{
    try {
      const res = await apiClient.get(
        `http://${binName}.local:5000/status`,
        {
          timeout: 10 * 1000
        }
      );
      return res.data.isRunning;
    } catch {
      return null;
    }
  }
  const GetBinStatusFull = async (binName)=>{
    try {
      const res = await apiClient.get(
        `http://${binName}.local:5000/status`,
        {
          timeout: 10 * 1000
        }
      );
      return res.data;
    } catch {
      return null;
    }
  }
  useEffect(() => {
    const updateFocus = () => {
      if (inputRef && inputRef.current) {
        setRestartModal(r=>{
          if (document.activeElement != inputRef.current && !r.showModal)
            inputRef.current.focus();
          return r;
        });
      }
    };
    if (checkInputInverval != null) clearInterval(checkInputInverval);
    setInterval(updateFocus, 1000);
  }, []);
  
  const BuildDisposePayload = (dataInput) =>
  {
    const {dataContainer,dataWeight,dataTransaction,dtSubmit} = dataInput;
    const _finalNeto = dataWeight; //neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
    const _p =  {
        idContainer: dataContainer.containerId,
        badgeId: user.badgeId,
        IdWaste: dataContainer.IdWaste,
        type: type,
        weight: _finalNeto,
        toBin: binDispose.name,
        status: "Done",
        fromContainer: dataTransaction?.toBin
          ? dataTransaction?.toBin
          : dataContainer.name,
        station: dataContainer.station,
        recordDate: dtSubmit
      };
    if (dataTransaction.idscraplog)
      _p.idscraplog = dataTransaction.idscraplog;
    _p.success = false;
    if (!_p.success) _p.status = "Pending|PIDSG";
    return {..._p};
  }
  const verifProcess =async  (disabled)=>{
    if (binDispose.name != scanData) {
      setErrDisposeMessage("mismatch name");
      setScanData("");
      return;
    }
    let check = true;
    if (containers[0].dataContainer.waste.handletype != "Rack") {
      const checkProcess = await checkProcessRunning();
      if (checkProcess && !binProblem.continue) {
        //setShowBinProblemMessage(true);
        setErrDisposeMessage("Transaction Process Haven't completed yet");
        return;
      }
      console.log({ verification: containers, binDispose: binDispose });
      binDispose.weight =
        getTotalWeight() + parseFloat(binDispose.weight);
      // try {
      //   await apiClient.post(
      //     `http://${binDispose.name_hostname}.local:5000/End`,
      //     {
      //       bin: binDispose,
      //     },
      //     {
      //       timeout: 10 * 1000
      //     }
      //   );
      // } 
      // catch (err) {
      //   console.log(err);
      //   await RefreshNetwork();
      //   setBinOffline(true);
      //   setScanData("");
      //   return;
      // }
    }
    else
    {
      const rackCheck = await checkAPI(rackTarget);
      setRackActive(rackCheck);
      if (!rackCheck)
        return;
    }
    const payloads = [];
    for (let i = 0; i < containers.length; i++) {
      if ( containers[i].dataContainer.waste.handletype != "Rack" && !check ) 
      {
        const isSensorTop = await readSensorTop(binDispose.name_hostname);
        check = isSensorTop;
        if (isSensorTop.error) {
          setErrDisposeMessage("Error Ketika Membaca Sensor");
          setScanData("");
          return;
        }
        if (!isSensorTop) {
          setErrDisposeMessage("Tutup Penutup Atas.");
          setScanData("");
          return;
        }
      }
      if ( containers[i].dataContainer.waste.handletype == "Rack" || waste.handletype == "Rack")
      {
        const res = await saveTransaksiRack(containers[i].dataContainer,binDispose.name,"Dispose",binDispose.id);
        if (res.length > 0)
          payloads.push(res[0])
      } 
      else 
      {
          payloads.push( 
            BuildDisposePayload(containers[i])
          );
      }
    }
    await saveTransaksi(payloads,disabled);
    setmessage("DATA TELAH MASUK");
    setContainers([]);
    setIdbin(binDispose.id);
    setTypeCollection(null);
    setBinDispose(null);
    setFinalStep(false);
    setWaste(null);
    setBinProblem({continue:false});
    //setinstruksimsg("DATA TELAH MASUK");
    setTimeout(async () => {
      setmessage("");
    }, 700);
    //VerificationScan();

    //                setScanData('');
  }
  const handleKeyPress = async (e) => {
    try {
      const check = await checkAPI("localhost:5000");
      if (!check)
      {
        setServerActive(check);
        return;
      }
      if (e.key === "Enter") {
        if (inputRef.current) inputRef.current.disabled = true;
        if (user == null) handleScan();
        else if (isFinalStep) {
            await verifProcess(false);
        } else if (container == null) {
          handleScan1();
        }
      }
    } catch {
      if (inputRef.current) inputRef.current.disabled = false;
    } finally {
      if (inputRef.current) inputRef.current.disabled = false;
    }
  };
  useEffect(() => {
    console.log({ currentContainer: containers });
  }, [containers]);
  useEffect(() => {
    if (!showModalInfoScale && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModalInfoScale]);

  useEffect(() => {
    if (!showModalDispose && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModalDispose]);

  const handleKeyPressModal = (e) => {
    if (e.key === "Enter") {
      setShowModalInfoScales(false);
      setShowModalDispose(false);
    }
  };
  const work = async () => {
    setTransactionData({});
    setWaste(null);
    setUser(null);
    setmessage("");
    setinstruksimsg(" ");
  };
  useEffect(() => {
    if (Idbin != -1) {
      if (Idbin != undefined) work();
      setScanData("");
      setContainer(null);
      setmessage("");
      setNeto(0);
      freezeNeto(false);
      setFinalStep(false);
      setIsSubmitAllowed(false);
      setIdbin(-1);
    }
  }, [Idbin]);
  useEffect(() => {
    if (toplockId !== "") {
      (async () => {
        try {
          //await sendLockTop();
          //await sendYellowOff();
          //await sendGreenlampOn();
        } catch (error) {
          console.log("Error executing actions:", error);
        } finally {
          settoplockId(""); // Clear the toplockId after all actions are done
        }
      })();
    }
  }, [toplockId]);
  const CheckBinCapacity = async () => {
    const _finalNeto = getWeight(); // neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
    try {
      const url =
        container.waste.handletype == "Rack" ? rackTarget : "localhost:5000";
      const response = await apiClient.post(`http://${url}/CheckBinCapacity`, {
        IdWaste: container.IdWaste,
        neto: _finalNeto,
      });

      const res = response.data;
      if (!res.success) {
        setAllowContinueModal(true);
        setErrDisposeMessage(res.message);
        return false;
      }
      res.bin.type = "Dispose";
      return res.bin;
    } catch (error) {
      console.log(error);
      return null;
    }
  };
  const CheckBinCapacityRack = async (data) => {
    try {
    const lines = data.trim().split("-");
    const line = lines[lines.length - 2];
    const res = await apiClient.post(
      `http://${rackTarget}/CheckBinCapacity`,
      {
        line: line,
        weight: getWeight()
      },
      {
        timeout: 10000,
      }
    );
    const bin = res.data.bins[0];
      const _res = await apiClient.get(`http://localhost:5000/bin/` + bin.name);
      bin.id = _res.data.bin.id;
      setBinDispose(bin);
      setBinname(bin.name);
      return bin;
    } catch (err) {
      setAllowContinueModal(true);
      setErrDisposeMessage("Bin From Rack Not Available");
      return null;
    }
  };
  useEffect(() => {
    if (!binDispose || binDispose == null || !binDispose.name_hostname) return;
//    setinstruksimsg("Buka Penutup Atas");
    //    sendType(binDispose.name_hostname, "Dispose");
  }, [binDispose]);
  useEffect(() => {
    if (user == null || container == null) setScanData("");
  }, [user, container]);
  const handleScan = () => {
    apiClient
      .post("http://localhost:5000/ScanBadgeid", { badgeId: scanData })
      .then((res) => {
        if (res.data.error) {
          setScanData("");
          setUser(null);
          setErrDisposeMessage(res.data.error);
        } else {
          if (res.data.user) {
            setUser(res.data.user);
            setScanData("");
            setmessage("Scan Bin Machine/Bin");
          } else {
            setErrDisposeMessage("User not found");
            setUser(null);
            setScanData("");
          }
        }
      })
      .catch((err) => console.log(err));
  };
  const verifyBadge = async (station) => {
    if (!user || !user.badgeId) return false;
    try {
      if (!isOnline) return false;
      const res = await apiClient.get(
        `http://${apiTarget}/api/pid/pibadgeverify?f1=${station}&f2=${user.badgeId}`,
        {
          timeout: 1000,
        }
      );
      console.log(res);
      return true;
    } catch (err) {
      console.log(err);
      return (
        err.message.includes("Network Error") || err.code == "ECONNABORTED"
      );
    }
  };
  const handleScan1 = async () => {
    try {
      if (containers.length > 0) {
        const checkIndex = containers.findIndex(
          (x) => x.dataContainer?.name.toLowerCase() == scanData.toLowerCase()
        );
        if (checkIndex != -1) {
          setAllowContinueModal(true);
          setErrDisposeMessage("Bin telah di scan mohon scan bin yang lain");
          return;
        }
      }
      else
        setWaste(null);
      const res = await apiClient.post("http://localhost:5000/ScanContainer", {
        containerId: scanData,
      });
      if (res.data.error) {
        setScanData("");
        setContainer(null);
        setIsSubmitAllowed(false);
        freezeNeto(false);
        setErrDisposeMessage(res.data.error);
        return;
      } else {
        setFinalNeto(0);
        setFinalStep(false);
        if (res.data.container) {
          const badgeCheck = await verifyBadge(res.data.container.station);
          /*if (!badgeCheck)
                    {
                        setErrDisposeMessage("Badge Check Failed");
                        return;
                    }*/
          console.log([res.data.container.IdWaste, waste])
          if ( waste != null && containers.length > 0 && res.data.container.IdWaste != waste.Id ) {

            setErrDisposeMessage("Waste Mismatch");
            setScanData("");
            return;
          }
          const prevWaste = waste?.name;
          const _waste = res.data.container.waste;
          setTypeCollection(res.data.container.type);
          setWaste(_waste);
          setmessage("");
          if (res.data.container.waste.handletype=='Rack')
          {
              const rackCheck = await checkAPI(rackTarget);
              setRackActive(rackCheck);
              if (!rackCheck)
                return;
          }
          if (res.data.container.type == "Collection") {
            if (!user.OUT) {
              setErrDisposeMessage("Unauthorized User for Collection");
              setUser(null);
              setScanData("");
              return;
            }
            if (continueState) {
              setErrDisposeMessage("Collection Transaction is not allowed");
              return;
            }
            const _bin = res.data.container.waste.bin.find(
              (item) => item.name == res.data.container.name
            );

            const checkProcess = await GetBinStatus(_bin.name_hostname);
            if (checkProcess == null && res.data.container.waste.handletype != "Rack")
            {
              setBinOffline(true);
              return;
            }
            if (checkProcess) {
              setErrDisposeMessage("Transaction Process Haven't completed yet, Please Submit Again after bin transaction completed.");
              return;
            }
            if (!_bin) {
              setErrDisposeMessage("Bin Collection error");
              return;
            }
            let collectionPayload = {
              ...res.data.container,
              weight: _bin.weight,
            };
            //                        await updateTransaksiManual(_idscraplog,"Collection",_waste);
            _bin.type = "Collection";
            try {
              if (res.data.container.waste.handletype != "Rack") {
                const resData = await apiClient.post(
                  `http://${_bin.name_hostname}.local:5000/Start`,
                  { bin: _bin }
                );
              }
            } catch (err) {
              console.log(err);
              await RefreshNetwork();
              setBinOffline(true);
              setContainer(null);
              return;
            }
            //await sendPesanTimbangan(_bin.name_hostname,"Buka Penutup Bawah");
            //await sendLockBottom(_bin);
            // await sendYellowOffCollection(_bin);
            //await sendGreenlampOnCollection(_bin);
            // const isPending = await UpdateBinWeightCollectionManual(_bin.id);
            // collectionPayload = {
            //   ...collectionPayload,
            //   status: isPending ? "PENDING|STEP3" : "Done",
            //   success: !isPending,
            // };
            //       setinstruksimsg("Buka Penutup Bawah");

            if (res.data.container.waste.handletype == "Rack") {
              await saveTransaksiRack(collectionPayload, "", "Collection",_bin.id);
            } else await saveTransaksiCollection(collectionPayload,_bin.id);
            //                            UpdateBinWeightCollection();
            //                        setBottomLockData({ binId: _bin.id, hostname: _bin.name_hostname });

            setShowModal(false);
            setScanData("");
            setUser(null);
            setContainer(null);
            //sendType(_bin.name_hostname, 'Collection');
            setBinname(_bin.name);
            setinstruksimsg("");
            setTypeCollection(null);
            setmessage("");
            return;
          } else {
            setmessage(getScaleName());
            let _idscraplog = "";
            if (!user.IN) {
              setErrDisposeMessage("Unauthorized User For Dispose");
              setUser(null);
              setScanData("");
              return;
            }
            if (continueState && _waste.name != prevWaste) {
              setErrDisposeMessage("Waste name mismatch");
              setScanData("");
              return;
            }
            if (_waste.step1) {
              try {
                const checkTr = await apiClient.get(
                  "http://localhost:5000/Transaksi/" + scanData
                );
                const tr = checkTr.data;
                _idscraplog = tr.idscraplog;
                setTransactionData(tr);
              } catch (err) {
                setErrDisposeMessage("Error Fetching Transaction");
                return;
              }
            } else setTransactionData({});
            setContainer(res.data.container);
            setType(res.data.container.type);
            setShowModalInfoScales(true);
          }
          setWastename(res.data.container.waste.name);
          setScanData("");
          setIsSubmitAllowed(true);
        } else {
          setErrDisposeMessage("Container not found");
          setUser(null);
          setContainer(null);
          setContainerName(res.data.name || "");
          setScanData("");
          setIsSubmitAllowed(false);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const VerificationScan = () => {
    apiClient
      .post("http://localhost:5000/VerificationScan", { binName: scanData })
      .then((res) => {
        if (res.data.error) {
          setErrDisposeMessage(res.data.error);
        } else {
        }
      })
      .catch((err) => console.log(err));
  };
  const getWeight = () => {
    return waste.scales == "4Kg" ? neto4Kg : neto50Kg;
  };
  const getScaleName = () => {
    //setmessage('');
    return waste && waste.scales
      ? waste.scales == "4Kg"
        ? "Silakan Gunakan Timbangan 4Kg"
        : "Silakan Gunakan Timbangan 50 Kg"
      : "";
  };

  /*     const getScaleName = () => {
            let scaleMessage = "";
            if (waste && waste.scales) {
                scaleMessage = waste.scales === "4Kg" ? "Silakan Gunakan Timbangan 4Kg" : "Silakan Gunakan Timbangan 50 Kg";
            }
            
            if (scaleMessage) {
                setmessage(scaleMessage);
                setTimeout(() => {
                    setmessage("");
                }, 3000); // Menghapus pesan setelah 3 detik
            }
            
            return () => clearTimeout(timer); 
        };*/
  const saveTransaksiRack = async (_container, binName, type,binId) => {
    const _finalNeto = _container.waste.scales == "4Kg" ? neto4Kg : neto50Kg;
    const res = await apiClient.post(
      `http://${rackTarget}/Transaksi`,
      {
        name: binName,
        containerName: transactionData.toBin
          ? transactionData?.toBin
          : _container.name,
        waste: _container.waste.name,
        payload: {
          badgeId: user.badgeId,
          //            idContainer: _container.containerId,
          //            IdWaste: _container.IdWaste,
          type: type,
          idqrmachine: binName,
          weight: _finalNeto,
        },
      },
      {
        timeout: 10000,
      }
    );
    if (res.data && res.data.msg) {
      const data = res.data.msg;
      if (type=='Collection')
      {
        await apiClient.post(`http://localhost:5000/SaveTransaksiCollection`, {
          payload: {
            idContainer: _container.containerId,
            badgeId: user.badgeId,
            IdWaste: _container.IdWaste,
            type: data.type,
            idscraplog: transactionData?.idscraplog ?? "",
            weight: 0,
            success: false,
            status: _container.status,
            fromContainer: type=="Collection" ?  _container.name :  (transactionData?.toBin ?? _container.name),
            toBin:  type=="Collection" ? undefined : binname
          },
          station:         data.station && type != "Collection"
          ? data.station
          : _container.station,
          logindate: moment().format("YYYY-MM-DD HH:mm:ss"),
          binId: binId
        });
        //            updateBinWeight();
        setWaste(null);
        setTransactionData({});
        setScanData("");
        setUser(null);
        setContainer(null);
        setmessage("");
        setNeto(0);
        freezeNeto(false);
        setFinalStep(false);
        setIsSubmitAllowed(false);
        setIdbin(-1);
        setScanData("");
        setinstruksimsg("");
        return [];
      }
      else
      {
        return [
          {
            idContainer: _container.containerId,
            badgeId: user.badgeId,
            IdWaste: _container.IdWaste,
            type: data.type,
            idscraplog: transactionData?.idscraplog ?? "",
            weight: _finalNeto,
            success: false,
            status: _container.status,
            fromContainer:  (transactionData?.toBin ?? _container.name),
            toBin:   binName,
            station:         data.station && type != "Collection"
            ? data.station
            : _container.station,
          }
        ]
      }
    }
  };
  const sendWeight = async (name, weight) => {
    try {
      if (!isOnline) return;
      const response = await apiClient.post(
        `http://${apiTarget}/api/pid/sendWeight`,
        {
          binname: name,
          weight: weight,
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {}
  };
  const saveTransaksi = async (payloads,disabled) => {
    const _p = {
      payload: [...payloads],
//      logindate:logindate,
      binId:binDispose.id,
      disabled: disabled ? 1: 0
    };
    // const isSuccess = await sendDataPanasonicServer(
    //   dataContainer.station,
    //   dataTransaction.toBin ? dataTransaction?.toBin : dataContainer.name,
    //   binDispose.name,
    //   _finalNeto,
    //   type
    // );
    try
    {
      await apiClient.post(
        "http://localhost:5000/SaveTransaksi",
        {
          ..._p,
        },
        {
          timeout: 20000,
        }
      );
    }
    catch (e)
    {
      console.log(e);
    }
  };

  const saveTransaksiCollection = async (_container,binId) => {
    // const resAPI = await sendDataPanasonicServer(
    //   _container.station,
    //   _container.name,
    //   "",
    //   _container.weight,
    //   "Collection"
    // );
    const res = await apiClient.post(
      `http://${process.env.REACT_APP_TIMBANGAN}/SaveTransaksiCollection`,
      {
        payload: {
          idContainer: _container.containerId,
          badgeId: user.badgeId,
          IdWaste: _container.IdWaste,
          type: _container.type,
          weight: _container.weight,
          success: false,
          status: "",
          fromContainer: _container.name
        },
        station:_container.station,
        binId: binId
      }
    );
    setWaste(null);
    setScanData("");
  };
  const refreshPage = ()=>{
    setRefreshModal(true);
  }
  const syncData = async ()=>{
    try
    {
      setSyncing(true);
      const res  = await apiClient.get('http://lcaolhsot:5000/sync-all',{
        validateStatus: ()=>true
      });
      console.log(res);
    }
    catch (er)
    {
      console.log(er);
    }
    finally
    {
      setSyncing(false);
    }
  }
  const updateBinWeight = async (dataWeight) => {
    try {
      const _finalNeto = dataWeight; //neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
      const response = await apiClient.post(
        "http://localhost:5000/UpdateBinWeight",
        {
          binId: binDispose.id,
          neto: _finalNeto,
        }
      );
      /*setScanData('');
            setUser(null);
            setContainer(null);
            setmessage('');
            setNeto(0);
            freezeNeto(false);
            setFinalStep(false);
            setIsSubmitAllowed(false);
            setIdbin(-1);*/
      // await sendGreenlampOff(binDispose.name_hostname);
      //await sendYellowOn(binDispose.name_hostname);
      return true;
    } catch (error) {
      console.log(error);
      setErrDisposeMessage(error.response.data.error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (btnSubmitRef.current) btnSubmitRef.current.disabled = true;
    setShowModal(false);
    try {
      const binWeight = container?.weightbin ?? 0;
      const totalWeight = parseFloat(neto) + parseFloat(binWeight);
      console.log(container);
      if (type == "Dispose") {
        if (neto4Kg > 4) {
          setErrDisposeMessage("Berat limbah melebihi kapasitas maximum");
          return;
        } else if (neto50Kg > 50) {
          setErrDisposeMessage("Berat limbah melebihi kapasitas maximum");
          return;
        }
        let checkBinAvailable = binDispose;
        if (!continueState || binDispose == null) {
          if (container.waste.handletype == "Rack") {
            let checkName = container.name;
            if (transactionData.idscraplog) {
              checkName = transactionData.toBin;
            }
            checkBinAvailable = await CheckBinCapacityRack(checkName);
//            checkBinAvailable.max_weight = 100;
          } else 
          {
            checkBinAvailable = await CheckBinCapacity();
            const statusBin = await GetBinStatusFull(checkBinAvailable.name_hostname); 
            // if (statusBin.isPending)
            // {
            //   setErrDisposeMessage(`Bin ${checkBinAvailable.name_hostname} Dalam Kondisi Pending`);
            //   return;
            // }
          }
        }
        setBinDispose(checkBinAvailable);
        setBinname(checkBinAvailable.name);
  
        if (checkBinAvailable == null && container.waste.handletype!='Rack') {
          setErrDisposeMessage("Invalid Bin Detected/Bin Disconnect");
          setContainer(null);
          return;
        }
        if (!checkBinAvailable )
        {
          setContainer(null);
           return;
        }
        if (checkBinAvailable.name_hostname && container.waste.handletype != 'Rack')
        {
          const checkProcess = await GetBinStatus(checkBinAvailable.name_hostname);
          if (checkProcess == null)
          {
            setBinOffline(true);
            return;              
          }
          if (checkProcess) {
            setErrDisposeMessage("Transaction Process Haven't completed yet, Please Submit Again after bin transaction completed.");
            return false;
          }
        }
        const curWeight =
          getTotalWeight() + getWeight() + parseFloat(checkBinAvailable.weight);
        console.log([
          curWeight,
          checkBinAvailable.max_weight,
          checkBinAvailable.weight,
        ]);
        if (curWeight >= parseInt(checkBinAvailable.max_weight)) {
          setAllowContinueModal(true);
          setErrDisposeMessage("Berat Timbangan Melebihi Kapasitas Maksimum");
          return;
        }
        if (
          curWeight <= parseFloat(checkBinAvailable?.max_weight ?? 100) &&
          container != null &&
          checkBinAvailable != null &&
          containers.findIndex(x=>x.dataContainer.name==container.name) == -1
        )
        {
            
          setContainers([
            ...containers,
            {
              dtSubmit:moment().format("YYYY-MM-DD HH:mm:ss"), 
              dataContainer: container,
              dataWeight: getWeight(),
              dataTransaction: transactionData,
            },
          ]);
        }
        setIsSubmitAllowed(false);
        //            setFinalStep(true);
        setmessage("");
        //            setShowModalDispose(true);
        if (container.waste.handletype == "Rack") {
          console.log(binDispose);
          setFinalStep(true);
          setmessage("Waiting For Verification");
          settoplockId(binDispose.name_hostname);
          setShowModalDispose(true);
          inputRef.current.focus();
          setAllowContinueModal(false);
          setContinueState(false);
        } else toggleContinueModal(true);
      }
    } catch {
      if (btnSubmitRef.current) btnSubmitRef.current.disabled = false;
    } finally {
      if (btnSubmitRef.current) btnSubmitRef.current.disabled = false;
    }
  };
  useEffect(() => {
    if (errDisposeMessage != "") setShowErrorDispose(true);
  }, [errDisposeMessage]);
  useEffect(() => {
    if (!showErrorDispose) {
      if (!allowContinueModal && inputRef.current) {
        inputRef.current.focus();
      }
      setErrDisposeMessage("");
    }
  }, [showErrorDispose]);
  const handleCancel = () => {
    toggleModal();
    freezeNeto(false);
  };
  const resetBin = async ()=>{
    if (binDispose && binDispose.name_hostname)
    {
      await apiClient.get(`http://${binDispose.name_hostname}.local:5000/clear-bin`);
      setTimeout(async () => {
        const resData = await apiClient.post(
          `http://${binDispose.name_hostname}.local:5000/Start`,
          { bin: binDispose },
          {
            timeout: 10 * 1000
          });
      }, 3000);
    }
  }
  const reloadBin = async (reloadLocal)=>{
//    await apiClient.get(`http://localhost:5000/reset-dispose`);
    if (containers.length > 0 && binDispose != null && binDispose.name_hostname) 
    {
      
      try
      {
        await apiClient.get(`http://${binDispose.name_hostname}.local:5000/clear-bin`);
        if (reloadLocal)
        {
            setTimeout(async ()=>{
              if (allowReload)
              {
                try
                {
                  const resData = await apiClient.post(
                  `http://${binDispose.name_hostname}.local:5000/Start`,
                  { bin: binDispose },
                  {
                    timeout: 10 * 1000
                  }
                  
                );
                }
                catch{}
              }          
          },2000);
        }
        else
          window.location.reload();
      }
      catch (er)
      {
        console.log(er);
      }
    }
    else
      window.location.reload();
  }
  const RestartSystem = async ()=>{
    try
    {
      await apiClient.get(`http://localhost:5000/restart`);
    }
    catch (er)
    {
      console.log(er);
    }
  }
  const RefreshNetwork = async ()=>{
    try
    {
      await apiClient.get(`http://localhost:5000/reset-network`);
    }
    catch (er)
    {
      console.log(er);
    }
  }
  const handleRestart = async()=>{
    try
    {
      const verif = await apiClient.post(`http://localhost:5000/verify-password`,{password:restartModal.passwordInput});
      setRestartModal({showModal:false,passwordInput:'',showPassword:false});
      if (verif.data.isValid==1)
      {
        
      await apiClient.get(`http://localhost:5000/reset-dispose`);
        localStorage.clear();
        if (binDispose && binDispose.name_hostname)
        {
          try
          {
            await apiClient.get(`http://${binDispose.name_hostname}.local:5000/clear-bin`);
          }
          catch{
          }
        }
        window.location.reload();
      }
      else
      {     
        setServerErr({show:true,message:"Password Tidak Benar"});
      }
    }
    catch (err)
    {
      setRestartModal({showModal:false,passwordInput:'',showPassword:false});
      console.log(err);
      setServerErr({show:true,message:err.message ?? "Terjadi Kesalahan dengan aplikasi"});
    }
  }
  const handleFormContinue = async (response) => {
    toggleContinueModal(false);
    setScanData("");
    if (response || containers.length < 1) {
      /*if (transactionData.idscraplog)
                await updateTransaksi('Dispose');
            if (container.waste.handletype=="Rack" || waste.handletype =='Rack')
                await saveTransaksiRack( container,binDispose.name,'Dispose');
            else
            {
                const _finalNeto = getWeight();//neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
                const response = await apiClient.post('http://localhost:5000/UpdateBinWeight', {
                    binId: binDispose.id,
                    neto: _finalNeto
                });
                await saveTransaksi();

            }*/

//      if (containers.length < 1 && !response) setUser(null);
      setAllowReload(false);
      setIsSubmitAllowed(false);
      setIdbin(-1);
      freezeNeto(false);
      setmessage("");
      setNeto(0);
      setScanData("");
      setinstruksimsg("-");
      setContainer(null);
      setTransactionData({});
      setFinalStep(false);
    } else {
      setAllowReload(true);
      try {
       if (containers[0].dataContainer.waste.handletype != "Rack") {
           const resData = await apiClient.post(
             `http://localhost:5000/Start`,
             { bin: binDispose },
             {
               timeout: 10 * 1000
             }
           );
         }
        setFinalStep(true);
        setmessage("Waiting For Verification");
        settoplockId(binDispose.name_hostname);
        setShowModalDispose(true);    
        setAllowContinueModal(false);
      } catch (err) {
        console.log(err);

//        const items = containers;
//        items.splice(-1, 1);
  //      setContainers((prev) => [...items]);
        await RefreshNetwork();
        setFinalStep(false);
        setIsSubmitAllowed(true);
        setIdbin(-1);
        setNeto(0);
        setScanData("");
        setAllowContinueModal(true);
//        setErrDisposeMessage('Bin Offline');
      }
    }
    inputRef.current.focus();
    setContinueState(response);
  };

  return (
    <main>
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-shrink-0 items-center">
                    <img
                      className="h-8 w-auto"
                      src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                      alt="Your Company"
                    />
                  </div>
                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white",
                            "rounded-md px-3 py-2 text-sm font-medium"
                          )}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      item.current
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <div className="bg-[#f4f6f9] p-5">
        <div className="grid grid-cols-3 grid-flow-col gap-5">
          {process.env.REACT_APP_4Kg == "1" && (
            <div
              className={`grid grid-cols-1 grid-flow-row gap-3 col-span-${
                process.env.REACT_APP_50Kg == "1" ? "1" : "2"
              }  `}
            >
              <div className="col-span-1 ...">
                <div className="flex-1 p-4 border rounded bg-white">
                  <h1 className="text-blue-600 font-semibold mb-2 text-xl">
                    Brutto
                  </h1>
                  <div className="">
                    <div className="flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold">
                      {((Scales4Kg?.weight4Kg ?? 0) * 1000).toFixed(2) ?? 0}
                      <FiRefreshCcw size={20} />
                    </div>
                    <p className="flex justify-center text-2xl font-bold">
                      Gram
                    </p>
                  </div>
                </div>
              </div>
              <div className="row-span-1 col-span-1">
                <div className="flex-1 p-4 border rounded bg-white">
                  <h1 className="text-blue-600 font-semibold mb-2 text-xl">
                    Netto
                  </h1>
                  <div className="">
                    <div className="flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold">
                      {(neto4Kg * 1000).toFixed(2)} <FiRefreshCcw size={20} />
                    </div>
                    <p className="flex justify-center text-2xl font-bold">
                      Gram
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {process.env.REACT_APP_50Kg == "1" && (
            <div
              className={`grid grid-cols-1 grid-flow-row gap-3 col-span-${
                process.env.REACT_APP_4Kg == "1" ? "1" : "2"
              } `}
            >
              <div className="col-span-1 ...">
                <div className="flex-1 p-4 border rounded bg-white">
                  <h1 className="text-blue-600 font-semibold mb-2 text-xl">
                    Brutto
                  </h1>
                  <div className="">
                    <div className="flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold">
                      {Scales50Kg?.weight50Kg?.toFixed(2) ?? 0}
                      <FiRefreshCcw size={20} />
                    </div>
                    <p className="flex justify-center text-2xl font-bold">
                      Kilogram
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-span- row-span-1">
                <div className="flex-1 p-4 border rounded bg-white">
                  <h1 className="text-blue-600 font-semibold mb-2 text-xl">
                    Netto
                  </h1>
                  <div className="">
                    <div className="flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold">
                      {neto50Kg.toFixed(2)} <FiRefreshCcw size={20} />
                    </div>
                    <p className="flex justify-center text-2xl font-bold">
                      Kilogram
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className={`row-span-1 col-span-1`}>
            <div className=" p-4 border rounded bg-white h-full">
              <h1 className="text-blue-600 font-semibold text-xl mb-3">
                Scanner Result
              </h1>
              <p>Please Scan..</p>
              <input
                type="text"
                autoFocus={true}
                name="text"
                autoComplete="off"
                id="userId"
                value={scanData}
                onBlur={() => {
                  if (inputRef && inputRef.current && !restartModal.showModal) inputRef.current.focus();
                }}
                onKeyDown={(e) => handleKeyPress(e)}
                ref={inputRef}
                onChange={(e) => setScanData(e.target.value)}
                className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder=""
              />
              <button
                className="block w-full border rounded py-2 flex justify-center items-center font-bold mt-5 bg-sky-400 text-white text-lg"
                disabled={!isSubmitAllowed}
                onClick={submitEvent}
              >
                Submit
              </button>
              <div className="text-lg mt-5">
                <p>Username: {user?.username} </p>
                <p>
                  Container Id:{" "}
                  {transactionData.toBin
                    ? transactionData?.toBin
                    : container?.name}
                </p>
                <p>Type Waste: {container?.waste.name}</p>
                <p>Waste Item:</p>
                {containers.map((item, index) => (
                  <>
                    <p>
                      {index + 1}. {item.dataContainer.name}{" "}
                      {parseFloat(item.dataWeight).toFixed(2)} Kg
                    </p>
                  </>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-start">
          {showModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                  <div className="text-center mb-4"></div>
                  <form>
                    <Typography variant="h4" align="center" gutterBottom>
                      {parseFloat(
                        /*neto50Kg > neto4Kg ? neto50Kg : neto4Kg*/ getWeight()
                      ).toFixed(3)}
                      Kg
                    </Typography>
                    <p>Data Timbangan Sudah Sesuai?</p>
                    <div className="flex justify-center mt-5">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        ref={btnSubmitRef}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 mr-2 rounded"
                      >
                        Ok
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          {showContinueModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <div className="bg-white rounded p-10 max-w-md mx-auto z-50">
                  <div className="text-center mb-4"></div>
                  <form>
                    <span className="text-2xl">
                      Apakah anda ingin menimbang lagi? (Item sejenis)
                    </span>
                    <div className="flex justify-center gap-8 mt-5">
                      <button
                        type="button"
                        onClick={() => handleFormContinue(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-2xl text-white font-bold py-3 px-5 mr-2 rounded"
                      >
                        Iya
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFormContinue(false)}
                        className="bg-gray-500 hover:bg-red-600 text-2xl text-white font-bold py-3 px-5 rounded"
                      >
                        Tidak
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-start">
          {refreshModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <div className="bg-white rounded p-10 max-w-md mx-auto z-50">
                  <div className="text-center mb-4"></div>
                  <form>
                    <span className="text-2xl">
                      Apakah benar mau di refresh?
                    </span>
                    <div className="flex justify-center gap-8 mt-5">
                      <button
                        type="button"
                        onClick={()=>{RestartSystem();setRefreshModal(false);}}
                        className="bg-blue-500 hover:bg-blue-600 text-2xl text-white font-bold py-3 px-5 mr-2 rounded"
                      >
                        Iya
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefreshModal(false)}
                        className="bg-gray-500 hover:bg-red-600 text-2xl text-white font-bold py-3 px-5 rounded"
                      >
                        Tidak
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          {refreshBinModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <div className="bg-white rounded p-10 max-w-md mx-auto z-50">
                  <div className="text-center mb-4"></div>
                  <form>
                    <span className="text-2xl">
                    Apakah benar anda ingin reset {binDispose?.name_hostname ?? ""} ?
                    </span>
                    <div className="flex justify-center gap-8 mt-5">
                      <button
                        type="button"
                        onClick={()=>{reloadBin(true);setRefreshBinModal(false);}}
                        className="bg-blue-500 hover:bg-blue-600 text-2xl text-white font-bold py-3 px-5 mr-2 rounded"
                      >
                        Iya
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefreshBinModal(false)}
                        className="bg-gray-500 hover:bg-red-600 text-2xl text-white font-bold py-3 px-5 rounded"
                      >
                        Tidak
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          {showErrorDispose && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                  <div className="text-center mb-4"></div>
                  <form>
                    <p>{errDisposeMessage}</p>
                    <div className="flex justify-center mt-5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowErrorDispose(false);
                          if (allowContinueModal) toggleContinueModal(true);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 mr-2 rounded"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          {binOffline && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                  <div className="text-center mb-4"></div>
                  <form>
                    <p>Bin Offline</p>
                    <div className="flex justify-center mt-5">
                      <button
                        type="button"
                        onClick={() => {
                          setBinOffline(false);
                          setScanData("");
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 mr-2 rounded"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          {showModalDispose && (
            <div
              className="fixed z-10 inset-0 overflow-y-auto"
              onKeyDown={handleKeyPressModal}
            >
              <div className="flex items-center justify-center min-h-screen">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                  <div className="text-center mb-4"></div>
                  <form>
                    <Typography variant="h4" align="center" gutterBottom>
                      Dispose Dialokasikan ke Bin: {binname} Waste:{wastename}
                    </Typography>
                    <div className="flex justify-center mt-5">
                      <button
                        type="button"
                        autoFocus={true}
                        onClick={() => {
                          setShowModalDispose(false);
                        }}
                        className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                      >
                        Oke
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          {showBinProblemMessage && (
            <div
              className="fixed z-10 inset-0 overflow-y-auto"
              onKeyDown={handleKeyPressModal}
            >
              <div className="flex items-center justify-center min-h-screen">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                  <div className="text-center mb-4"></div>
                  <form>
                    <Typography variant="h4" align="center" gutterBottom>
                      Bin {binname} Belum Selesai Transaksi.
                    </Typography>
                    <div className="flex justify-center gap-2 mt-5">
                      <button
                        type="button"
                        autoFocus={true}
                        onClick={  () => {
                          setShowBinProblemMessage(false);
                          setBinProblem({continue:false});
                          resetBin();
                        }}
                        className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                      >
                        Ulangi Proses Transaksi di Bin
                      </button>
                      <button
                        type="button"
                        autoFocus={true}
                        onClick={() => {

                          setShowBinProblemMessage(false);
                          setBinProblem({continue:true});
                          verifProcess(true);
                        }}
                        className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                      >
                        Tetap Lanjutkan Verifikasi
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-start">
        {serverErr.show && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <p>{serverErr.message}</p>
                                        <div className="flex justify-center mt-5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setServerErr((prev) => ({ show: false, message: '' }));
                                                    setServerActive(true);
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 mr-2 rounded"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
        </div>
        <div className="flex justify-start">
          {showModalInfoScale &&
            process.env.REACT_APP_50Kg == "1" &&
            process.env.REACT_APP_4Kg == "1" && (
              <div
                className="fixed z-10 inset-0 overflow-y-auto"
                onKeyDown={handleKeyPressModal}
              >
                <div className="flex items-center justify-center min-h-screen">
                  <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                  ></div>

                  <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                    <div className="text-center mb-4"></div>
                    <form>
                      <Typography variant="h4" align="center" gutterBottom>
                        {getScaleName()}
                      </Typography>
                      <div className="flex justify-center mt-5">
                        <button
                          type="button"
                          autoFocus={true}
                          onClick={() => setShowModalInfoScales(false)}
                          className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                        >
                          Oke
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {restartModal.showModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4">

                                    </div>
                                    <form>
                                        <Typography variant="h4" align="center" gutterBottom>
                                            Masukkan password untuk melakukan restart.
                                        </Typography>

                                        <TextField
                                            type={restartModal.showPassword ? 'text' : 'password'}
                                            label="Pin"
                                            value={restartModal.passwordInput}
                                            onChange={(e) => setRestartModal({...restartModal,passwordInput: e.target.value})}
                                            variant="outlined"
                                            fullWidth
                                            autoFocus={true}
                                            margin="normal"
                                            required
                                            focused
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={()=>setRestartModal({...restartModal,showPassword:!restartModal.showPassword})}>
                                                            {restartModal.showPassword ? <Visibility /> : <VisibilityOff />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />

                                        <div className="flex justify-center mt-5">
                                            <button type="button" onClick={handleRestart} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 mr-2 rounded">Ok</button>
                                            <button type="button" onClick={()=>setRestartModal({...restartModal,showModal:false})} className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                        </div>
                                    </form>
                                    <Keyboard
                                        onChange={(e) => setRestartModal({...restartModal,passwordInput: e.target?.value ?? e })}
                                        layout={{
                                            default: [
                                                "1 2 3",
                                                "4 5 6",
                                                "7 8 9",
                                                "0 {bksp}"
                                            ]
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
        </div>

        <p>Instruksi : {message} </p>
      </div>
      <footer className="flex-1 rounded border flex flex-col justify-center gap-1 p-3 bg-white">
        <p className="text-center">
          Server Status: {ipAddress} {isOnline ? "Online" : "Offline"}
        </p>
        
        { process.env.REACT_APP_VERSION && <p>Version : {process.env.REACT_APP_VERSION} </p>}
      <div className="flex gap-3 flex-row w-100 justify-end pe-5">
      {
        binDispose?.name_hostname &&
        <button 
        
        onClick={()=>setRefreshBinModal(true)}
        // disabled={isSubmitAllowed || syncing || isFinalStep}
        className={`p-3 border rounded py-2 w-100  justify-center items-center font-bold mt-5 ${/*!isSubmitAllowed && !syncing && !isFinalStep*/ true ? "bg-sky-400 " : "bg-gray-600"} text-white text-lg`}
        >Reset Bin</button>
      }
      {/* <button 
        onClick={()=>syncData()}
        disabled={isSubmitAllowed || syncing}
        className={`p-3 border rounded py-2  justify-center items-center font-bold mt-5 ${!isSubmitAllowed && !syncing ? "bg-sky-400 " : "bg-gray-600"} text-white text-lg`}
        >Sync Data</button> */}
              <button 
        onClick={()=>refreshPage()}
        // disabled={isSubmitAllowed || syncing || isFinalStep}
        className={`p-3 border rounded py-2 w-100  justify-center items-center font-bold mt-5 ${/*!isSubmitAllowed && !syncing && !isFinalStep*/ true ? "bg-sky-400 " : "bg-gray-600"} text-white text-lg`}
        >Refresh</button>
                      <button 
        onClick={()=>setRestartModal({...restartModal,showModal:true})}
        // disabled={isSubmitAllowed || syncing || isFinalStep}
        className={`p-3 border rounded py-2 w-100  justify-center items-center font-bold mt-5 ${/*!isSubmitAllowed && !syncing && !isFinalStep*/ true ? "bg-sky-400 " : "bg-gray-600"} text-white text-lg`}
        >Restart</button>
      </div>
      
                
      </footer>
    </main>
  );
};

export default Home;
