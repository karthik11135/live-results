import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Papa from 'papaparse';
import axios from 'axios';

interface Participant {
  id?: number;
  name: string;
  solves: string[];
}

const DataEntry: React.FC = () => {
  const { event } = useParams<{ event: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState('');
  const [solves, setSolves] = useState<string[]>([]);
  const [numSolves, setNumSolves] = useState(3); // Default number of solves

  // Set the number of solves based on the event
  useEffect(() => {
    if (event === '3x3') {
      setNumSolves(3);
      setSolves(['', '', '']); // Reset to 3 empty solves
    } else if (event === '4x4' || event === '2x2' || event === '3x3oh' || event === 'pyra') {
      setNumSolves(5);
      setSolves(['', '', '', '', '']); // Reset to 5 empty solves
    }
  }, [event]);

  // Load participants from the backend when the component mounts
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await axios.get(`http://10.102.71.103:5000/participants?event=${event}`);
        setParticipants(response.data);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };
    fetchParticipants();
  }, [event]);

  const handleAddParticipant = async () => {
    if (name && solves.every(solve => solve)) {
      const newParticipant: Participant = { name, solves };
      try {
        const response = await axios.post(`http://10.102.71.103:5000/participants?event=${event}`, newParticipant);
        setParticipants([...participants, response.data]);
        setName('');
        setSolves(Array(numSolves).fill('')); // Reset solves based on selected number
      } catch (error) {
        console.error('Error adding participant:', error);
        alert('Error adding participant. Please try again.');
      }
    } else {
      alert('Please enter a name and all solve times.');
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const importedParticipants = results.data as Participant[];
          try {
            await Promise.all(importedParticipants.map(async (participant) => {
              const response = await axios.post(`http://10.102.71.103:5000/participants?event=${event}`, participant);
              return response.data;
            }));
            const updatedParticipants = [...participants, ...importedParticipants];
            setParticipants(updatedParticipants);
          } catch (error) {
            console.error('Error importing participants:', error);
            alert('Error importing participants. Please check the format.');
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error parsing CSV file. Please check the format.');
        },
      });
    }
  };

  const handleSolveChange = (index: number, value: string) => {
    const updatedSolves = [...solves];
    updatedSolves[index] = value;
    setSolves(updatedSolves);
  };

  return (
    <div>
      <h2>Data Entry for {event.toUpperCase()}</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Participant Name"
      />
      {Array.from({ length: numSolves }).map((_, index) => (
        <input
          key={index}
          type="text"
          value={solves[index]}
          onChange={(e) => handleSolveChange(index, e.target.value)}
          placeholder={`Solve Time ${index + 1}`}
        />
      ))}
      <button onClick={handleAddParticipant}>Add Participant</button>
      <input type="file" accept=".csv" onChange={handleImportCSV} />
      <h3>Current Participants</h3>
      <ul>
        {participants.map((participant, index) => (
          <li key={index}>
            {participant.name}: {participant.solves.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DataEntry