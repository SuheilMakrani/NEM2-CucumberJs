# CucumberJS for NEM2 Javascript (Catapult)

This project is built on the CucumberJS Framework to test the features available inside the NEM2 Javascript SDK (Catapult).    
It contains the FEATURES files with the scenarios (test cases) to test out various features available in the SDK.

#### Important Notes

* Scenarios are the .FEATURE files located inside the **/features** directory.    
* Step Definitions are the Javascript files located inside the **/features/step_definitions** directory.    
* This project is done by two interns [SuheilMakrani](https://github.com/SuheilMakrani) and [Ken Low](https://github.com/lowkaweiken) learning and working on the Cucumber Testing Framework. A pull request (PR) will be made soon to demonstrate the scenarios done. 
* For more detailed scenarios, please refer to https://github.com/nemtech/nem2-scenarios.git 

_More Scenarios to be added_

## FOLDER STRUCTURE

<pre>
CucumberJS
│   package-lock.json
│   package.json
│   README.md
│   features # feature files
│   ├── aggregated               
│   │   ├── agg_bonded.feature           
│   │   ├── agg_bonded_test_lockfunds.feature      
│   │   ├── agg_bonded-3party.feature          
│   │   ├── agg_complete.feature          
│   │   ├── cosign_agg_tx_bonded_multi_acc.feature       
│   │   └── cosign_aggregate_tx_bonded.feature          
│   ├── mosaics             
│   │   ├── create_mosaic.feature           
│   │   └── get_mosaics.feature          
│   ├── namespace            
│   │   ├── create_namespace.feature           
│   │   └── create_subnamespace.feature           
│   ├── secret_lock             
│   │   └── secret_lock_tx.feature           
│   ├── step_definitions             # Step Definition (SD) files 
│   │   ├── agg_bonded.js             
│   │   ├── agg_bonded_test_lockfunds.js           
│   │   ├── agg_bonded-3party.js           
│   │   ├── agg_complete.js            
│   │   ├── cosign_agg_tx_bonded_multi_acc.js              
│   │   ├── cosign_aggregate_tx_bonded.js            
│   │   ├── create_mosaic.js               
│   │   ├── create_namespace.js               
│   │   ├── create_subnamespace.js                
│   │   ├── get_mosaics.js           
│   │   ├── cucumber.js             
└   └   └── secret_lock.tx            
    
</pre>

#### HOW TO INSTALL THIS PROJECT    
1) Import Project by using `git clone http://172.16.18.111/0118525/cucumberjs` 
2) Go into project directory using `cd cucumberjs`
3) Install node dependencies using `npm install`

#### BEFORE RUNNING THE TEST SCENARIOS
You need to create THREE(3) accounts    
1) If you have not install NEM2-CLI, install via Terminal/Powershell using this command
<pre>npm install -g nem2-cli</pre>    

2) Create the accounts 
<pre>nem2-cli account generate -n MIJIN_TEST –save -u http://localhost:3000
</pre>
*Note: You can change localhost to another API Endpoint e.g. http://api.beta.catapult.mijin.io:3000*

For every account created, it will come with:    
* Private Key
* Public Key
* Address    

Save these information into a .txt file for easier access.

3) Get some Test XEMs for all three accounts. You can get it from this link:     
http://test-nem-faucet.44uk.net/

4) For every &lt;alice_privatekey&gt; and similar, replace it with the account information you just saved.

#### HOW TO RUN ALL TEST SCENARIOS    
In the *features* directory, run `npm test`     

#### HOW TO RUN SPECIFIC TEST SCENARIOS    
In the *features* directory, run `npm test -- --name "<scenario outline name from feature files without arrrows>"`    

Example:
`npm test -- --name "Creating mosaics" `
<pre>
Feature: Create mosaic

   Scenario Outline: Creating mosaics  &lt;---- *THIS*
      Given "&lt;alice_privatekey&gt;" want to create a moisaic at "&lt;nodeURL&gt;"
      When "&lt;alice_privatekey&gt;" add a mosaic named "&lt;mosaicName&gt;" in namespace named "&lt;namespaceName&gt;"
      Then "&lt;alice_privatekey&gt;" should get a transaction hash

      Examples:
         | nodeURL                         | alice_privatekey                                                 | namespaceName | mosaicName |
         | http://catapult48gh23s.xyz:3000 | BXDSDFDSF093E8BB3EF992F957539CF0D72522D37918A4B9224151C9F0B8B615 | namespace_sam | mosaic_sam |
</pre>

#### HOW TO CHANGE TEST INPUT DATA:    
Inside the feature file, change the values inside the Examples section (after the first row). You can try multiple test data:    
Example:     
<pre>
Feature: Create mosaic

   Scenario Outline: Creating mosaics 
      Given "&lt;alice_privatekey&gt;" want to create a moisaic at "&lt;nodeURL&gt;"
      When "&lt;alice_privatekey&gt;" add a mosaic named "&lt;mosaicName&gt;" in namespace named "&lt;namespaceName&gt;"
      Then "&lt;alice_privatekey&gt;" should get a transaction hash

      Examples:
         | nodeURL  | alice_privatekey | namespaceName | mosaicName |
         |    P1    |        Q1        |       R1      |     S1     |
         |    P2    |        Q2        |       R2      |     S2     |
         |    P3    |        Q3        |       R3      |     S3     |
         |    P4    |        Q4        |       R4      |     S4     |
         
</pre>

