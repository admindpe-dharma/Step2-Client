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

const apiClient = axios.create({
  withCredentials: false,
  timeout: 2000,
});
const Home = () => {
  const [user, setUser] = useState(null);
  const [Scales4Kg, setScales4Kg] = useState({});
  const [Scales50Kg, setScales50Kg] = useState({});
  const [continueState, setContinueState] = useState(false);
  const [isFinalStep, setFinalStep] = useState(false);
  const [scanData, setScanData] = useState("");
  const [container, setContainer] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [waste, setWaste] = useState(null);
  const [wastename, setWastename] = useState("");
  const [Idbin, setIdbin] = useState(-1);
  const [binname, setBinname] = useState("");
  const [containerName, setContainerName] = useState("");
  const [isFreeze, freezeNeto] = useState(false);
  const [isSubmitAllowed, setIsSubmitAllowed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showContinueModal, toggleContinueModal] = useState(false);
  const [showModalDispose, setShowModalDispose] = useState(false);
  const [allowContinueModal, setAllowContinueModal] = useState(false);
  const [showModalInfoScale, setShowModalInfoScales] = useState(false);
  const [showErrorDispose, setShowErrorDispose] = useState(false);
  const [errDisposeMessage, setErrDisposeMessage] = useState("");
  const [finalneto, setFinalNeto] = useState(0);
  const [neto, setNeto] = useState({});
  const [neto50Kg, setNeto50kg] = useState(0);
  const [neto4Kg, setNeto4kg] = useState(0);
  const [toplockId, settoplockId] = useState({ hostname: "" });
  const [instruksimsg, setinstruksimsg] = useState("");
  const [message, setmessage] = useState("");
  const [type, setType] = useState("");
  const [typecollection, setTypeCollection] = useState("");
  const [weightbin, setWeightbin] = useState("");
  const [binDispose, setBinDispose] = useState(null);
  //const [ScaleName, setScaleName] = useState("");
  const inputRef = useRef(null);
  const btnSubmitRef = useRef(null);
  const [bottomLockHostData, setBottomLockData] = useState({
    binId: "",
    hostname: "",
  });
  const [socket, setSocket] = useState(); // Sesuaikan dengan alamat server
  const [rackTarget, setRackTarget] = useState(process.env.REACT_APP_RACK);
  const [apiTarget, setApiTarget] = useState(process.env.REACT_APP_PIDSG);
  const [transactionData, setTransactionData] = useState({});
  const [logindate, setLoginDate] = useState("");
  const [containers, setContainers] = useState([]);
  const [checkInputInverval, setCheckInputInterval] = useState(null);
  const [ipAddress, setIpAddress] = useState("");
  //const ScaleName = getScaleName();
  const navigation = [{ name: "Dashboard", href: "#", current: true }];

  //    const socket = null;

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
  useEffect(() => {
    const getIp = async () => {
      try {
        const ip = await apiClient.get(`http://localhost:5000/ip`);
        setIpAddress(ip.data[0]);
      } catch {
        getIp();
      }
    };
    getIp();
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
      if (response.status != 200) {
        return false;
      }
      await sendWeight(frombinname, weight);
      return response.data.status == "Success";
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
      setIsOnline(true);
    });
    socket.on("disconnect", () => {
      setIsOnline(false);
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
      finalWeight = parseFloat(Scales4Kg.weight4Kg) - parseFloat(binWeight);
    }
    if (isFreeze) return;
    setNeto4kg(finalWeight);
  }, [Scales4Kg, container?.weightbin]);

  const toggleModal = () => {
    freezeNeto(true);
    setShowModal(!showModal);
  };

  const toggleModalDispose = () => {
    //freezeNeto(true);
    setShowModalDispose(!showModalDispose);
  };
  const checkProcessRunning = async () => {
    try {
      if (!binDispose) return;
      const res = await apiClient.get(
        `http://${binDispose.name_hostname}.local:5000/status`
      );
      return res.data.isRunning;
    } catch {
      return false;
    }
  };
  useEffect(() => {
    const updateFocus = () => {
      if (inputRef && inputRef.current) {
        if (document.activeElement != inputRef.current)
          inputRef.current.focus();
      }
    };
    if (checkInputInverval != null) clearInterval(checkInputInverval);
    setInterval(updateFocus, 1000);
  }, []);
  const handleKeyPress = async (e) => {
    try {
      if (e.key === "Enter") {
        if (inputRef.current) inputRef.current.disabled = true;
        if (user == null) handleScan();
        else if (isFinalStep) {
          if (binDispose.name != scanData) {
            setErrDisposeMessage("mismatch name");
            setScanData("");
            return;
          }
          const checkProcess = await checkProcessRunning();
          if (checkProcess) {
            setErrDisposeMessage("Transaction Process Haven't completed yet");
            return;
          }
          let check = true;
          console.log({ verification: containers, binDispose: binDispose });
          for (let i = 0; i < containers.length; i++) {
            if (
              containers[i].dataContainer.waste.handletype != "Rack" &&
              !check
            ) {
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
            if (containers[i].dataTransaction.idscraplog)
              await updateTransaksi(containers[i].dataTransaction, "Dispose");
            if (
              containers[i].dataContainer.waste.handletype == "Rack" ||
              waste.handletype == "Rack"
            )
              await saveTransaksiRack(
                containers[i].dataContainer,
                binDispose.name,
                "Dispose"
              );
            else {
              const success = await updateBinWeight(containers[i].dataWeight);
              if (success)
                await saveTransaksi(
                  containers[i].dataContainer,
                  containers[i].dataWeight,
                  containers[i].dataTransaction
                );
            }
          }
          binDispose.weight = getTotalWeight() + parseFloat(binDispose.weight);
          await apiClient.post(`http://${binDispose.name_hostname}/End`, {
            bin: binDispose,
          });
          setmessage("DATA TELAH MASUK");

          //setinstruksimsg("DATA TELAH MASUK");
          setTimeout(async () => {
            setmessage("");
            //setinstruksimsg(" ");
            //await sendPesanTimbangan(binDispose.name_hostname, "");
            setContainers([]);
            setIdbin(binDispose.id);
            setTypeCollection(null);
            setBinDispose(null);
          }, 2000);
          //VerificationScan();

          //                setScanData('');
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
      const resData = await apiClient.post(
        `http://${res.bin.name_hostname}/Start`,
        { bin: res.bin }
      );
      setBinDispose(res.bin);
      setBinname(res.bin.name);
      return res.bin;
    } catch (error) {
      console.log(error);
      return null;
    }
  };
  const CheckBinCapacityRack = async (data) => {
    const lines = data.trim().split("-");
    const line = lines[lines.length - 2];
    const res = await apiClient.post(`http://${rackTarget}/CheckBinCapacity`, {
      line: line,
    });
    const bin = res.data.bins[0];
    try {
      const _res = await apiClient.get(`http://localhost:5000/bin/` + bin.name);
      bin.id = _res.data.bin.id;
      setBinDispose(bin);
      setBinname(bin.name);
      return bin;
    } catch (err) {
      setAllowContinueModal(true);
      setErrDisposeMessage("Bin From Rack not found");
      return null;
    }
  };
  useEffect(() => {
    if (!binDispose || binDispose == null || !binDispose.name_hostname) return;
    setinstruksimsg("Buka Penutup Atas");
    //    sendType(binDispose.name_hostname, "Dispose");
  }, [binDispose]);
  async function sendLockTop() {
    try {
      const response = await apiClient.post(
        `http://${toplockId}.local:5000/locktop/`,
        {
          idLockTop: 1,
        }
      );
      setinstruksimsg("Buka Penutup Atas");
    } catch (error) {
      console.log(error);
    }
  }
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
            setLoginDate(formatDate(new Date().toISOString()));
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
          (x) => x.dataContainer?.name == scanData
        );
        if (checkIndex != -1) {
          setAllowContinueModal(true);
          setErrDisposeMessage("Bin telah di scan mohon scan bin yang lain");
          return;
        }
      }
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
          /*if ( waste != null && res.data.container.IdWaste != waste.IdWaste ) {
                        alert("Waste Mismatch");
                        return;
                    }*/
          const prevWaste = waste?.name;
          const _waste = res.data.container.waste;
          setTypeCollection(res.data.container.type);
          setWaste(_waste);
          setmessage("");
          if (res.data.container.type == "Collection") {
            if (!user.OUT) {
              setErrDisposeMessage("Unauthorized User for Collection");
              return;
            }
            if (continueState) {
              setErrDisposeMessage("Collection Transaction is not allowed");
              return;
            }
            const _bin = res.data.container.waste.bin.find(
              (item) => item.name == res.data.container.name
            );

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
            const resData = await apiClient.post(
              `http://${_bin.name_hostname}/Start`,
              { bin: _bin }
            );
            //await sendPesanTimbangan(_bin.name_hostname,"Buka Penutup Bawah");
            //await sendLockBottom(_bin);
            // await sendYellowOffCollection(_bin);
            //await sendGreenlampOnCollection(_bin);
            const isPending = await UpdateBinWeightCollectionManual(_bin.id);
            collectionPayload = {
              ...collectionPayload,
              status: isPending ? "PENDING|STEP3" : "",
              success: !isPending,
            };
            //       setinstruksimsg("Buka Penutup Bawah");

            if (res.data.container.waste.handletype == "Rack") {
              await saveTransaksiRack(collectionPayload, "", "Collection");
            } else await saveTransaksiCollection(collectionPayload);
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
  const saveTransaksiRack = async (_container, binName, type) => {
    const _finalNeto = _container.waste.scales == "4Kg" ? neto4Kg : neto50Kg;
    const res = await apiClient.post(`http://${rackTarget}/Transaksi`, {
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
    });
    if (res.data && res.data.msg) {
      const data = res.data.msg;
      const isSuccess = await sendDataPanasonicServer(
        data.station && type != "Collection"
          ? data.station
          : _container.station,
        transactionData.toBin ? transactionData?.toBin : _container.name,
        binName,
        data.weight,
        type
      );
      await apiClient.post("http://localhost:5000/SaveTransaksi", {
        payload: {
          idContainer: _container.containerId,
          badgeId: user.badgeId,
          IdWaste: _container.IdWaste,
          type: data.type,
          weight: data.weight,
          success: isSuccess,
        },
      });
      //            updateBinWeight();
      //            setWaste(null);
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
    }
  };
  const sendWeight = async (name, weight) => {
    try {
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
  const saveTransaksi = async (dataContainer, dataWeight, dataTransaction) => {
    const _finalNeto = dataWeight; //neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
    const _p = {
      payload: {
        idContainer: dataContainer.containerId,
        badgeId: user.badgeId,
        IdWaste: dataContainer.IdWaste,
        type: type,
        weight: _finalNeto,
        toBin: binDispose.name,
        fromContainer: dataTransaction?.toBin
          ? dataTransaction?.toBin
          : dataContainer.name,
      },
    };
    const isSuccess = await sendDataPanasonicServer(
      dataContainer.station,
      dataTransaction.toBin ? dataTransaction?.toBin : dataContainer.name,
      binDispose.name,
      _finalNeto,
      type
    );
    if (dataTransaction.idscraplog)
      _p.payload.idscraplog = dataTransaction.idscraplog;
    _p.success = isSuccess;
    if (!_p.success) _p.payload.status = "Pending|PIDSG";
    await apiClient.post(
      "http://localhost:5000/SaveTransaksi",
      {
        ..._p,
      },
      {
        timeout: 10000,
      }
    );
  };
  const updateTransaksi = async (trdata, type) => {
    await updateTransaksiManual(trdata.idscraplog, type, waste);
  };
  const updateTransaksiManual = async (_idscraplog, _type, _waste) => {
    const _finalNeto = waste
      ? getWeight()
      : _waste.scales == "4Kg"
      ? neto4Kg
      : neto50Kg;
    const res = await apiClient.put(
      "http://localhost:5000/Transaksi/" + _idscraplog,
      {
        type: _type,
        status: "Done",
        weight: _finalNeto,
        logindate: logindate,
      },
      {
        validateStatus: (status) => {
          return true;
        },
      }
    );
    //        setWaste(null);
    setScanData("");
    setinstruksimsg("");
  };
  const updateContainerstatus = async () => {
    //const _finalNeto = getWeight();
    try {
      const response = await apiClient.post(
        `http://localhost:5000/UpdateContainerStatus`,
        {
          containerName: container.name,
          status: "",
        }
      );
      if (response.status != 200) {
        return;
      }
    } catch (error) {}
  };

  const saveTransaksiCollection = async (_container) => {
    const resAPI = await sendDataPanasonicServer(
      _container.station,
      _container.name,
      "",
      _container.weight,
      "Collection"
    );
    let status = "";
    if (_container.status.includes("|")) {
      // There is Issue on Step 3
      status = resAPI ? _container.status : `${_container.status}|PIDSG`;
    } else {
      status = resAPI ? _container.status : "PENDING|PIDSG";
    }
    const isSuccess = !status.includes("|");

    const res = await apiClient.post(
      `http://${process.env.REACT_APP_TIMBANGAN}/SaveTransaksiCollection`,
      {
        payload: {
          idContainer: _container.containerId,
          badgeId: user.badgeId,
          IdWaste: _container.IdWaste,
          type: _container.type,
          weight: _container.weight,
          success: isSuccess,
          status: status,
        },
      }
    );
    setWaste(null);
    setScanData("");
  };

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
            checkBinAvailable.max_weight = 100;
          } else checkBinAvailable = await CheckBinCapacity();
        }
        if (checkBinAvailable == null) {
          setErrDisposeMessage("Invalid Bin Detected");
          setContainer(null);
          return;
        }
        if (!checkBinAvailable) return;
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
          checkBinAvailable != null
        )
          setContainers([
            ...containers,
            {
              dataContainer: container,
              dataWeight: getWeight(),
              dataTransaction: transactionData,
            },
          ]);
        setIsSubmitAllowed(false);
        //            setFinalStep(true);
        setmessage("");
        //            setShowModalDispose(true);
        toggleContinueModal(true);
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

      if (containers.length < 1 && !response) setUser(null);
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
      setFinalStep(true);
      setmessage("Waiting For Verification");
      settoplockId(binDispose.name_hostname);
      setShowModalDispose(true);
    }
    inputRef.current.focus();
    setAllowContinueModal(false);
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
                  if (inputRef && inputRef.current) inputRef.current.focus();
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
                onClick={toggleModal}
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
                      ).toFixed(2)}
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
        </div>

        <p>Instruksi : {message} </p>
      </div>
      <footer className="flex-1 rounded border flex justify-center gap-40 p-3 bg-white">
        <p>
          Server Status: {ipAddress} {isOnline ? "Online" : "Offline"}
        </p>
      </footer>
    </main>
  );
};

export default Home;
