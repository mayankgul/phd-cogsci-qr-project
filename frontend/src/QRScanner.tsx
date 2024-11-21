import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";

const QRScanner = () => {
  const [result, setResult] = useState("");
  const [response, setResponse] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogSeverity, setDialogSeverity] = useState("success");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 3, qrbox: { width: 500, height: 500 } },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
      },
      (error) => {
        console.error(`QR Code scan error: ${error}`);
      }
    );

    const handleScan = async (data: string) => {
      try {
        const jsonPayload = JSON.parse(data);
        console.log("Decoded QR Code Data:", jsonPayload);

        const res = await fetch(`http://localhost:5002/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonPayload),
        });

        const responseData = await res.json();
        setResponse(responseData.message);

        if (res.status !== 200) {
          scanner.clear();
          setDialogMessage(
            res.status === 404
              ? "User does not exist!"
              : "User already scanned!"
          );
          setDialogSeverity("error");
          openDialog();
        } else {
          scanner.clear();
          setDialogMessage("User Verified Successfully!");
          setDialogSeverity("success");
          openDialog();
        }
      } catch (error) {
        scanner.clear();
        setDialogMessage("User could not be verified!");
        setDialogSeverity("error");
        openDialog();
      }
    };

    const openDialog = () => {
      setDialogOpen(true);

      setTimeout(() => {
        setDialogOpen(false);

        scanner.render(
          (decodedText) => {
            handleScan(decodedText);
          },
          (error) => {
            console.error(`QR Code scan error: ${error}`);
          }
        );
      }, 3000);
    };

    return () => {
      scanner.clear();
    };
  }, []);

  // const closeDialog = () => {
  //   setDialogOpen(false);

  //   setDialogMessage("");
  //   setDialogSeverity("");
  // };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ height: "100vh", backgroundColor: "#f5f5f5" }}
    >
      <Card sx={{ maxWidth: 600, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h4" align="center" mb={2}>
            Please scan your QR Code
          </Typography>

          <Box id="reader" />
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        // onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{ minHeight: 250 }}
      >
        <DialogContent>
          <Typography
            variant="h6"
            textAlign="center"
            color={dialogSeverity === "success" ? "green" : "red"}
          >
            {dialogMessage}
          </Typography>
        </DialogContent>
        {/* <DialogActions>
          <Button onClick={closeDialog} autoFocus>
            OK
          </Button>
        </DialogActions> */}
      </Dialog>
    </Box>

    // <div style={{ justifyContent: "center", alignItems: "center" }}>
    //   <h1>QR Code Scanner</h1>
    //   <div id="reader" style={{ width: "300px" }} ref={scannerRef}></div>
    //   <p>QR Code: {result}</p>
    //   <p>Server Response: {response}</p>
    // </div>
  );
};

export default QRScanner;
