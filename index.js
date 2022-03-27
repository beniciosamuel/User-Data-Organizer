/* -------------- Users Data Organizer --------------
    Read inputs of users, format and organize datas.
    The file of input consists to a .csv
    The output file is a .json
    The code will search all values and organizer by
    yours respectives headers.
    The field 'eid' will indetifier a user from others.
    All phone entries are being checked and
    evaluated by the google-libphonenumber.
---------------------------------------------------*/
import fs from 'fs';
import * as lineReader from 'line-reader';
import libphonenumber from 'google-libphonenumber';

// Get a instance to use the library 'google-libphonenumber'
const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

// Paths of files
const pathInput = './input1.csv';
const pathOutput = './output1.json';

// Setup the Enviroment
let studentsData = []; // A docker to contents of Users
let rawGroups = []; // A docker to groups
let rawAddresses = []; // A docker to Addresses
let i = 0; 
let header;

// Write a initial file from Output
fs.writeFileSync(pathOutput, '');

// Read line by line until the last
lineReader.eachLine(pathInput, ((line, last) => {
    // Split the values from the string-line 
    // A Regex to verify all occurrences of comma and others.
    const values = line.split(/,(?! )/); 

    if (i == 0) {
        header = values; // Get the headers
    } else {
        // All values will be send to analysis and organization.
        makeObj(header, values).then((state) => {
            if (last == true && state == true) {
                // Then when the last line arrives it will write the output.
                fs.appendFileSync(pathOutput, JSON.stringify(studentsData, '', '\t'), (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
        });
    }

    i++;
}))

/*---------- Organizer ----------
    This function organizes the data
    to be added to an Array. 
    Its return is an object with the 
    elements organized.
--------------------------------------*/
function organizer(studentData) {
    let groups = [];
    let addresses = [];
    // Set the samples of states
    const states = {
        '1': true,
        'yes': true,
        'no': false,
        '': false,
        '0': false
    }

    if (rawGroups != []) {
        rawGroups.push(studentData['group'].split(/[\;/,"]/gi));
    } else {
        rawGroups = studentData['group'].split(/[\;/,"]/gi);
    }

    // Eliminates unwanted characters 
    // and eliminates them.
    rawGroups.forEach((arrm) => {
        arrm.forEach((el) => {
            if (el != "") {
                groups.push(el.trim());
            }
        })
    })

    /*----------------- Address handling -----------------
        First, will be verified the type of address.
        Then the values will be separates and evaluates.
    ----------------------------------------------------*/
    Object.keys(studentData).forEach((header, index, arr) => {
        if (header.replace("\"", "").split(' ')[0] == 'email' || 
        header.replace("\"", "").split(' ')[0] == 'phone') {
            const type = header.replace(/[\",]/gi, "").split(' ')[0];
            let tags = [];
            let spl = header.replace(/[\",]/gi, "").split(' ')
            spl.forEach((el, j, orr) => {
                if (j != 0) {
                    tags.push(el);
                }
            })
            
            studentData[header].split(/[\",/]/gi).forEach((el) => {
                if (el != ';') {
                    // Transform the occurrence into a number to be tested.
                    const numFormat = el.replace(/[\;() -]/gi, "");
                    // Approves if the number is national.
                    if (type == 'phone' && isNaN(numFormat) == false) {           
                        if (phoneUtil.isValidNumber((phoneUtil.parseAndKeepRawInput('+55'+numFormat))) === true) {
                            addresses.push({
                                "type": type,
                                "tags": tags,
                                "address": '55' + numFormat
                            })
                        }
                    }

                    // Transform the occurrence in a email.
                    const regex = /\S+@\S+\.\S+/;
                    if (type == 'email' && regex.test(el) == true) {                        
                        addresses.push({
                            "type": type,
                            "tags": tags,
                            "address": el.replace(/[\;:" (),]/gi, "")
                        })
                    }
                }
            })
        }
    })

    if (rawAddresses != []) {
        rawAddresses.push(addresses);
    } else {
        rawAddresses = addresses;
    }

    let concludedAddress = [];

    // Transform all of address in a 
    // single array of objects.
    rawAddresses.forEach(arrm => {
        arrm.forEach(el => {
            concludedAddress.push(el);
        })
    })

    return {
        "fullname": studentData.fullname.replace(';', ''),
        "eid": studentData.eid,
        "groups": [... new Set(groups)],
        "addresses": [... new Set(concludedAddress)],
        "invisible": states[studentData.invisible.split(';')[0]],
        "see_all": states[studentData.see_all.split(';')[0]]
    }
}


/* ----------------- Make Object -----------------
    This role will manage all processes until
    the object be added in the desired format.
------------------------------------------------*/
async function makeObj (head, elements) {
    let newData = new Object();
    const eid = elements[1];

    // Eliminates occurrences with undefined value.
    async function littleOrganizer (first, values) {
        first.forEach((el, j, arr) => {
            if (newData[first[j]] === undefined) {
                newData[first[j]] = '';
            }

            newData[first[j]] += values[j] + ';';
        });
    }

    // Check if the object is repeated.
    const dataTemp = studentsData.find(obj => {
        return obj["eid"] == eid + ';';            
    })

    // A promise to ensure the return.
    return new Promise((res, rej) => {
        // Check if object is repeated.
        if (!dataTemp) {     
            rawGroups = []; 
            rawAddresses = []  
            littleOrganizer(head, elements)
            studentsData.push(organizer(newData));
            res(true);
        } else {
            const index = studentsData.indexOf(dataTemp);
            if (index !== -1) {
                Object.keys(studentsData[index]).forEach((el, k, arr) => {
                    if (studentsData[index][k] != "eid") {
                        newData[studentsData[index][k]] = studentsData[index][k]
                    }
                })
                littleOrganizer(head, elements)
                studentsData[index] = organizer(newData);
                res(true);
            }
        }
    })
}

/* -----------------------------------------------------
        Created By Benicio Samuel (briariustecno)
----------------------------------------------------- */