/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';


interface DrawPoint {
  x: number;
  y: number;
}


const App:React.FC = () => {
 
  const [drawingPath, setDrawingPath] = useState<string>('');
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [eraserHistory, setEraserHistory] = useState<string[]>([]);

  const svgRef = useRef<Svg | null>(null);
  const viewShotRef = useRef<ViewShot | null>(null);


  const [undoHistory, setUndoHistory] = useState<string[]>([]);
  const [penColor, setPenColor] = useState<string>('#000000');
  const [penType, setPenType] = useState<'pen' | 'eraser'>('pen');
  const [eraserActive, setEraserActive] = useState<boolean>(false); // Add eraserActive state

  const handleTouchStart = (e: any) => {
    if (penType === 'pen' && !eraserActive) {
      const { locationX, locationY } = e.nativeEvent;
      setDrawingPath(`M ${locationX} ${locationY}`);
    }
  };

  const handleTouchMove = (e: any) => {
    if (penType === 'pen' && !eraserActive) {
      const { locationX, locationY } = e.nativeEvent;
      setDrawingPath(`${drawingPath} L ${locationX} ${locationY}`);
    }
  };

  const handleTouchEnd = () => {
    if (penType === 'pen' && !eraserActive) {
      setDrawingHistory([...drawingHistory, drawingPath]);
      setDrawingPath('');
    }
  };


  const handleUndo = () => {
     if (drawingHistory.length > 0) {
      const updatedDrawingHistory = drawingHistory.slice(0, -1);
      const lastPath = drawingHistory[drawingHistory.length - 1];
      setDrawingHistory(updatedDrawingHistory);
      setUndoHistory([...undoHistory, lastPath]);
      setEraserHistory([...eraserHistory, lastPath]);

    }
  };
  
   const handleRedo = () => {
     if (undoHistory.length > 0) {
      const lastUndoPath = undoHistory[undoHistory.length - 1];
      setUndoHistory(undoHistory.slice(0, -1));
      setDrawingHistory([...drawingHistory, lastUndoPath]);
      setEraserHistory(eraserHistory.slice(0, -1));
    }
  };

  const handleClearCanvas = () => {
    setDrawingHistory([]);
    setDrawingPath('');
    setEraserHistory([]);

  };

  const handlePenColorChange = (color: string) => {
    setPenColor(color);
    setPenType('pen');
    setEraserActive(false);
  };

  const handleEraser = () => {
    setPenType('eraser');
     setDrawingPath('')
     setEraserActive(true); 
  };

  const handlePen = () => {
    setPenType('pen');
    setPenColor('#000000'); 
     setEraserActive(false); 
  };

  const handleExport = async() => {
  try {
       await viewShotRef.current?.capture().then(async (uri) => {
        const imagePath = RNFS.CachesDirectoryPath + '/drawing.png';
        await RNFS.copyFile(uri, imagePath);
        Alert.alert('Success', 'Drawing exported as image!');
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export drawing as image.');
    }
  };

  const handleSave = async() => {
   try {
      const svgSnapshot:any = await viewShotRef.current?.capture();
      // Save the SVG snapshot as a file (for example, in SVG format)
      const svgPath = RNFS.CachesDirectoryPath + '/drawing.png';
      await RNFS.writeFile(svgPath, svgSnapshot, 'base64');
      Alert.alert('Success', 'Drawing saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save drawing.');
    }
  };



   const handleShare = async () => {
     try {
      await viewShotRef.current?.capture().then(async (uri) => {
        const imagePath = RNFS.CachesDirectoryPath + '/drawing.png';
        await RNFS.copyFile(uri, imagePath);

        const shareOptions = {
          url: 'file://' + imagePath,
          type: 'image/png',
          title: 'Handwritten Drawing',
        };

        Share.open(shareOptions)
          .then((res) => {
            console.log('share response', res);
          })
          .catch((err) => {
            err && console.log('share response error', err);
          });
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share drawing.');
    }
  };


  const renderDrawingHistory = () => {
    return drawingHistory.map((path, index) => (
      <Path key={index} 
        d={path} 
        fill="none" 
        stroke={penType === 'pen' ? penColor : '#FFFFFF'}
        strokeWidth="2" />
    ));
  };

  const renderEraserHistory = () => {
    return eraserHistory.map((path, index) => (
      <Path
        key={`eraser_${index}`}
        d={path}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="10" // Increase the strokeWidth to make the eraser more effective
      />
    ));
  };

  


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hand writing board</Text>
      <View style={styles.canvasContainer}>
        <ViewShot ref={viewShotRef} options={{ fileName: "Your-File-Name", format: "jpg", quality: 0.9 }}>
          <Text>Capture </Text>
        </ViewShot>
          <Svg
            ref={(ref) => (svgRef.current = ref)}
            style={styles.canvas}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {renderEraserHistory()}
            {renderDrawingHistory()} 
            <Path
              d={drawingPath}
              fill="none"
              stroke={penType === 'pen' ? penColor : '#FFFFFF'}
              strokeWidth="2"
            />
          </Svg>
        {/* </ViewShot> */}
      </View>
      <View style={styles.toolsContainer}>
        <TouchableOpacity onPress={handleUndo}>
          <Text>Undo</Text>
        </TouchableOpacity>
         <TouchableOpacity onPress={handleRedo}>
          <Text>Redo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClearCanvas}>
          <Text>Clear</Text>
        </TouchableOpacity>
        {eraserActive ? 
        <TouchableOpacity onPress={handlePen}>
          <Text>Pen</Text>
        </TouchableOpacity> : <TouchableOpacity onPress={handleEraser}>
          <Text>Eraser</Text>
        </TouchableOpacity>}
        
        <View style={styles.penColorContainer}>
          <TouchableOpacity
            style={[styles.penColorOption, { backgroundColor: '#000000' }]}
            onPress={() => handlePenColorChange('#000000')}
          />
          <TouchableOpacity
            style={[styles.penColorOption, { backgroundColor: '#FF0000' }]}
            onPress={() => handlePenColorChange('#FF0000')}
          />
          {/* Add more color options as needed */}
        </View>
        <TouchableOpacity onPress={handleExport}>
          <Text>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave}>
          <Text>Save</Text>
        </TouchableOpacity>
         <TouchableOpacity onPress={handleShare}>
          <Text>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5A5A5A',
  },
  title:{
    fontSize:25, fontWeight:'500',color:"#000000",marginTop:40,alignSelf:"center"
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: '80%',
    height: '80%',
    backgroundColor: '#FFFFFF',
  },
  toolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#F9F9F9',
  },
  penColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  penColorOption: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 4,
  },
});

export default App;
